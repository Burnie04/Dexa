from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime, timezone # ✨ Updated Import
import uuid

db = SQLAlchemy()

chat_participants = db.Table('chat_participants',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('chat_id', db.Integer, db.ForeignKey('chat.id'), primary_key=True)
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.Text, nullable=False)
    owned_chats = db.relationship('Chat', backref='owner', lazy=True)
    joined_chats = db.relationship('Chat', secondary=chat_participants, backref=db.backref('participants', lazy='dynamic'))

class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), default="New Conversation")
    # ✨ FIX: Use timezone-aware datetime
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    share_code = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    is_collaborative = db.Column(db.Boolean, default=False)
    messages = db.relationship('Message', backref='chat', lazy=True, cascade="all, delete")

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chat.id'), nullable=False)
    sender = db.Column(db.String(50), nullable=False)
    text = db.Column(db.Text, nullable=False)
    mood = db.Column(db.String(50), default='neutral')
    spotify_embed_id = db.Column(db.String(100), nullable=True)
    file_attachment = db.Column(db.Text, nullable=True)
    # ✨ FIX: Use timezone-aware datetime
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))