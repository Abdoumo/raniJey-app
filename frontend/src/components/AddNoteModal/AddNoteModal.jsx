import React, { useState } from "react";
import "./AddNoteModal.css";
import { assets } from "../../assets/frontend_assets/assets";

const AddNoteModal = ({ itemName, onConfirm, onCancel }) => {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes);
  };

  return (
    <div className="add-note-modal">
      <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} className="add-note-container">
        <div className="add-note-title">
          <h2>Add Special Instructions</h2>
          <img
            onClick={onCancel}
            src={assets.cross_icon}
            alt="Close"
          />
        </div>
        
        <p className="add-note-item-name">For: <strong>{itemName}</strong></p>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., No onions, Extra spicy, Allergies: peanuts, Special requests..."
          className="add-note-textarea"
          maxLength="500"
        />
        
        <div className="add-note-char-count">
          {notes.length}/500 characters
        </div>

        <div className="add-note-buttons">
          <button type="button" className="add-note-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="add-note-confirm">
            Add to Cart
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddNoteModal;
