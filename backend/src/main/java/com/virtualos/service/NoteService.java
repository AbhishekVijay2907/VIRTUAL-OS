package com.virtualos.service;

import com.virtualos.dto.NoteDto;
import com.virtualos.exception.ResourceNotFoundException;
import com.virtualos.model.Note;
import com.virtualos.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    public List<Note> getNotes(String userId) {
        return noteRepository.findByUserId(userId);
    }

    public Note createNote(String userId, NoteDto dto) {
        Note note = new Note(
                userId,
                dto.getTitle() == null || dto.getTitle().trim().isEmpty() ? "Untitled Note" : dto.getTitle(),
                dto.getContent() == null ? "" : dto.getContent(),
                dto.getCategory() == null ? "General" : dto.getCategory(),
                LocalDateTime.now()
        );
        return noteRepository.save(note);
    }

    public Note updateNote(String userId, String noteId, NoteDto dto) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        if (!note.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized modification request");
        }

        if (dto.getTitle() != null) {
            note.setTitle(dto.getTitle().trim().isEmpty() ? "Untitled Note" : dto.getTitle());
        }
        if (dto.getContent() != null) {
            note.setContent(dto.getContent());
        }
        if (dto.getCategory() != null) {
            note.setCategory(dto.getCategory());
        }
        note.setUpdatedAt(LocalDateTime.now());

        return noteRepository.save(note);
    }

    public void deleteNote(String userId, String noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        if (!note.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized delete request");
        }

        noteRepository.delete(note);
    }
}
