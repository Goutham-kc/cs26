const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const Thread = require('../models/Thread');
const User = require('../models/User');
const SPLedger = require('../models/SPLedger');

const router = express.Router();

async function awardSP(userId, delta, reason, event, threadId = null) {
  await User.findByIdAndUpdate(userId, { $inc: { sp: delta } });
  await SPLedger.create({ userId, delta, reason, event, threadId });
}

async function promoteReply(thread, replyId) {
  const reply = thread.threadReplies.id(replyId);
  if (!reply) return null;
  await Thread.findByIdAndUpdate(thread._id, {
    status: 'Resolved',
    resolvedBy: reply.repliedBy,
    bestReplyId: replyId,
    $set: { 'threadReplies.$[r].isPromoted': true, 'threadReplies.$[r].isAcceptedFirst': true } },
    { arrayFilters: [{ 'r._id': replyId }] }
  );
  await awardSP(
    reply.repliedBy, 50,
    `Best reply accepted: Thread "${thread.title.slice(0, 60)}"`,
    'THREAD_RESOLVE', thread._id
  );
  return reply;
}

async function checkAutoPromote(thread) {
  if (thread.status !== 'Open') return;
  for (const reply of thread.threadReplies) {
    if (reply.isPromoted || reply.isAcceptedFirst) continue;
    if (reply.upvotes >= 3) {
      await promoteReply(thread, reply._id);
      return true;
    }
  }
  return false;
}

router.get('/', async (req, res) => {
  try {
    const { status, priority, category, label, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.categoryTag = category;
    if (label) filter.labels = { $in: Array.isArray(label) ? label : [label] };
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [threads, total] = await Promise.all([
      Thread.find(filter)
        .sort({ isPinned: -1, priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('raisedBy', 'name role')
        .populate('assignedTo', 'name role'),
      Thread.countDocuments(filter)
    ]);

    res.json({ threads, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id)
      .populate('raisedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .populate('assignedTo', 'name role')
      .populate('threadReplies.repliedBy', 'name role');

    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    await Thread.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, body, categoryTag, labels } = req.body;
    if (!title || !body || !categoryTag) {
      return res.status(400).json({ message: 'title, body, and categoryTag required' });
    }

    const thread = await Thread.create({
      title, body, categoryTag, labels: labels || [],
      raisedBy: req.user._id
    });

    const io = req.app.get('io');
    if (io) io.emit('thread:created', thread);
    res.status(201).json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/reply', auth, async (req, res) => {
  const io = req.app.get('io');
  try {
    const { replyText, parentReplyId, mentions, labels } = req.body;
    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    if (thread.isLocked) return res.status(403).json({ message: 'Thread is locked' });

    const replyData = {
      repliedBy: req.user._id,
      replyText,
      parentReplyId: parentReplyId || null,
      mentions: mentions || [],
      labels: labels || []
    };

    const updatedThread = await Thread.findByIdAndUpdate(
      req.params.id,
      { $push: { threadReplies: replyData } },
      { new: true }
    ).populate('threadReplies.repliedBy', 'name role');

    if (io) io.emit('thread:replied', { threadId: thread._id });

    res.json(updatedThread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/reply/:replyId/vote', auth, async (req, res) => {
  const io = req.app.get('io');
  try {
    const { type } = req.body;
    if (!['up', 'down'].includes(type)) return res.status(400).json({ message: 'type must be up or down' });

    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const reply = thread.threadReplies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const userId = req.user._id;
    const alreadyUpvoted = reply.upvotedBy?.some(id => id.equals(userId));
    const alreadyDownvoted = reply.downvotedBy?.some(id => id.equals(userId));

    if (type === 'up') {
      if (alreadyUpvoted) return res.status(400).json({ message: 'Already upvoted' });
      if (alreadyDownvoted) {
        await Thread.updateOne(
          { _id: thread._id, 'threadReplies._id': reply._id },
          { $pull: { 'threadReplies.$.downvotedBy': userId }, $inc: { 'threadReplies.$.downvotes': -1, 'threadReplies.$.upvotes': 1 }, $addToSet: { 'threadReplies.$.upvotedBy': userId } }
        );
      } else {
        await Thread.updateOne(
          { _id: thread._id, 'threadReplies._id': reply._id },
          { $inc: { 'threadReplies.$.upvotes': 1 }, $addToSet: { 'threadReplies.$.upvotedBy': userId } }
        );
      }
    } else {
      if (alreadyDownvoted) return res.status(400).json({ message: 'Already downvoted' });
      if (alreadyUpvoted) {
        await Thread.updateOne(
          { _id: thread._id, 'threadReplies._id': reply._id },
          { $pull: { 'threadReplies.$.upvotedBy': userId }, $inc: { 'threadReplies.$.upvotes': -1, 'threadReplies.$.downvotes': 1 }, $addToSet: { 'threadReplies.$.downvotedBy': userId } }
        );
      } else {
        await Thread.updateOne(
          { _id: thread._id, 'threadReplies._id': reply._id },
          { $inc: { 'threadReplies.$.downvotes': 1 }, $addToSet: { 'threadReplies.$.downvotedBy': userId } }
        );
      }
    }

    const updatedThread = await Thread.findById(req.params.id);
    const updatedReply = updatedThread.threadReplies.id(req.params.replyId);

    const promoted = await checkAutoPromote(updatedThread);
    if (promoted) {
      if (io) io.emit('thread:resolved', { threadId: thread._id, title: thread.title });
      return res.json({ code: 'AUTO_PROMOTED', message: 'Reply auto-promoted by community votes', thread: updatedThread });
    }

    res.json({ reply: updatedReply, thread: updatedThread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/reply/:replyId/accept', auth, async (req, res) => {
  const io = req.app.get('io');
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const reply = thread.threadReplies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });

    const promoted = await promoteReply(thread, req.params.replyId);
    if (!promoted) return res.status(500).json({ message: 'Failed to accept reply' });

    const updatedThread = await Thread.findById(req.params.id);
    if (io) io.emit('thread:resolved', { threadId: thread._id, title: thread.title });

    res.json({ code: 'ACCEPTED', message: 'Best reply accepted as answer', thread: updatedThread });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/resolve', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  const io = req.app.get('io');
  try {
    const { spReward, rewardUserId } = req.body;
    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    await Thread.findByIdAndUpdate(
      req.params.id,
      { status: 'Resolved', resolvedBy: req.user._id },
      { new: true }
    );

    if (spReward && rewardUserId) {
      await awardSP(rewardUserId, spReward, `Thread resolved: "${thread.title.slice(0, 60)}"`, 'THREAD_RESOLVE', thread._id);
    }

    const updatedThread = await Thread.findById(req.params.id).populate('raisedBy', 'name role').populate('resolvedBy', 'name role');
    if (io) io.emit('thread:resolved', { threadId: thread._id, title: thread.title });

    res.json({
      code: 'RESOLVED',
      message: 'Thread marked as resolved',
      thread: updatedThread,
      awarded: spReward && rewardUserId ? { userId: rewardUserId, sp: spReward } : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/upvote', auth, async (req, res) => {
  const io = req.app.get('io');
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const userId = req.user._id;
    const alreadyUpvoted = thread.upvotedBy?.some(id => id.equals(userId));

    if (alreadyUpvoted) return res.status(400).json({ message: 'Already upvoted' });

    await Thread.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvoteCount: 1 }, $addToSet: { upvotedBy: userId } }
    );

    const updatedThread = await Thread.findById(req.params.id).populate('raisedBy', 'name role');
    if (io) io.emit('thread:upvoted', { threadId: thread._id, upvoteCount: updatedThread.upvoteCount });
    res.json(updatedThread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/close', auth, requireRole('mentor', 'admin', 'superadmin'), async (req, res) => {
  const io = req.app.get('io');
  try {
    const { spReward, rewardUserId } = req.body;
    const thread = await Thread.findByIdAndUpdate(
      req.params.id,
      { isLocked: true, status: 'Locked' },
      { new: true }
    ).populate('raisedBy', 'name');

    if (spReward && rewardUserId) {
      await awardSP(
        rewardUserId,
        spReward,
        `Thread closed: "${thread.title.slice(0, 60)}"`,
        'THREAD_CLOSE',
        thread._id
      );
    }

    if (io) io.emit('thread:locked', { threadId: thread._id });
    res.json({ thread, awarded: spReward ? { userId: rewardUserId, sp: spReward } : null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/lock', auth, requireRole('mentor', 'admin', 'superadmin'), async (req, res) => {
  try {
    const thread = await Thread.findByIdAndUpdate(
      req.params.id,
      { isLocked: true, status: 'Locked' },
      { new: true }
    );
    const io = req.app.get('io');
    if (io) io.emit('thread:locked', { threadId: thread._id });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/unlock', auth, requireRole('mentor', 'admin', 'superadmin'), async (req, res) => {
  try {
    const thread = await Thread.findByIdAndUpdate(
      req.params.id,
      { isLocked: false, status: 'Open' },
      { new: true }
    );
    const io = req.app.get('io');
    if (io) io.emit('thread:unlocked', { threadId: thread._id });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/assign', auth, requireRole('mentor', 'admin', 'superadmin'), async (req, res) => {
  try {
    const { userId } = req.body;
    const thread = await Thread.findByIdAndUpdate(
      req.params.id,
      { assignedTo: userId || null },
      { new: true }
    ).populate('assignedTo', 'name role');
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/priority', auth, requireRole('mentor', 'admin', 'superadmin'), async (req, res) => {
  try {
    const { priority } = req.body;
    if (!['NORMAL', 'HIGH'].includes(priority)) return res.status(400).json({ message: 'Invalid priority' });
    const thread = await Thread.findByIdAndUpdate(req.params.id, { priority }, { new: true });
    const io = req.app.get('io');
    if (io && priority === 'HIGH') io.emit('thread:escalated', { threadId: thread._id, title: thread.title });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    await Thread.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;