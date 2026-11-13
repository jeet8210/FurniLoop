import Notification from '../models/Notification.js';
import { emitToUser } from './realtime.js';

export async function createNotification({ recipient, actor, type, title, body, conversation, listing }) {
  if (!recipient) return null;
  try {
    const notification = await Notification.create({ recipient, actor, type, title, body, conversation, listing });
    emitToUser(recipient.toString(), 'notification:new', notification.toObject());
    return notification;
  } catch (error) {
    console.error('Could not create marketplace notification:', error.message);
    return null;
  }
}
