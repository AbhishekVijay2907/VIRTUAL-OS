package com.virtualos.controller;

import com.virtualos.dto.NoteDto;
import com.virtualos.model.Note;
import com.virtualos.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired
    private NoteService noteService;

    private String getAuthenticatedUserId() {
        return (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<Note>> getNotes() {
        String userId = getAuthenticatedUserId();
        List<Note> notes = noteService.getNotes(userId);
        return ResponseEntity.ok(notes);
    }

    @PostMapping
    public ResponseEntity<Note> createNote(@RequestBody NoteDto dto) {
        String userId = getAuthenticatedUserId();
        Note note = noteService.createNote(userId, dto);
        return ResponseEntity.ok(note);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Note> updateNote(@PathVariable String id, @RequestBody NoteDto dto) {
        String userId = getAuthenticatedUserId();
        Note note = noteService.updateNote(userId, id, dto);
        return ResponseEntity.ok(note);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable String id) {
        String userId = getAuthenticatedUserId();
        noteService.deleteNote(userId, id);
        return ResponseEntity.noContent().build();
    }
}
