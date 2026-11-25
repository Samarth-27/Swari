import { query } from '../db/connection.js';
import { logger } from '../lib/logger.js';

export class ChatRepository {
  constructor(localStoreRef) {
    this.store = localStoreRef;
  }

  getChatMessages(tripId) {
    const trip = this.store.data.trips.find(x => x.id === tripId);
    if (trip && trip.chatMessages) {
      return trip.chatMessages;
    }
    this.store.data.chats = this.store.data.chats || {};
    return this.store.data.chats[tripId] || [];
  }

  addChatMessage(tripId, message) {
    const trip = this.store.data.trips.find(x => x.id === tripId);
    const msgObj = {
      id: message.id || `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tripId,
      sender: message.sender || 'passenger',
      senderName: message.senderName || 'Verified Member',
      text: message.text || '',
      time: message.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: message.type || 'TEXT',
      passengerName: message.passengerName || undefined,
      requestDetails: message.requestDetails || undefined,
      timestamp: new Date().toISOString()
    };

    if (trip) {
      trip.chatMessages = trip.chatMessages || [];
      trip.chatMessages.push(msgObj);
    }

    this.store.data.chats = this.store.data.chats || {};
    this.store.data.chats[tripId] = this.store.data.chats[tripId] || [];
    this.store.data.chats[tripId].push(msgObj);

    this.store.save();

    query(
      `INSERT INTO chat_messages (id, trip_id, sender, sender_name, text, type, passenger_name, request_details, time_display)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING`,
      [
        msgObj.id,
        tripId,
        msgObj.sender,
        msgObj.senderName,
        msgObj.text,
        msgObj.type,
        msgObj.passengerName || null,
        msgObj.requestDetails ? JSON.stringify(msgObj.requestDetails) : null,
        msgObj.time
      ]
    ).catch(err => logger.debug({ err: err.message }, 'Postgres chat_messages insert background sync skipped'));

    return msgObj;
  }
}

export default ChatRepository;
