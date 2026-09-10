import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true
    },
    teacherId: {
      type: String,
      required: true
    },
    originalText: {
      type: String,
      required: true
    },
    originalLanguage: {
      type: String,
      default: 'Hindi'
    },
    translations: {
      type: Map,
      of: Object,
      default: {}
    },
    audioUrl: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// In-memory fallback
export const inMemoryBroadcasts = [];

export const Broadcast = mongoose.models.Broadcast || mongoose.model('Broadcast', broadcastSchema);
