import {
  Component,
  Input,
  OnInit,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { CaseNote } from '../../core/models/case-note.model';
import { MOCK_CASE_NOTES } from '../../core/mock/case-notes.mock';
import { AuthService } from '../../core/services/auth.service';
import { AuditService } from '../../core/services/audit.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-case-notes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    TimeAgoPipe,
  ],
  template: `
    <div class="case-notes-container">
      @if (authService.isOfficer()) {
        <mat-card class="add-note-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>edit_note</mat-icon>
            <mat-card-title>
              {{ editingNoteId() ? 'Edit Case Note' : 'Add Intelligence Note' }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Intelligence summary / Observation</mat-label>
              <textarea
                matInput
                rows="3"
                [(ngModel)]="noteContent"
                placeholder="Enter field observation, phone intercept, or source report..."
              ></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Tags (comma separated)</mat-label>
              <input matInput [(ngModel)]="noteTags" placeholder="e.g. wiretap, border, vehicle" />
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions align="end">
            @if (editingNoteId()) {
              <button mat-button (click)="cancelEdit()">Cancel</button>
              <button mat-flat-button color="primary" [disabled]="!noteContent.trim()" (click)="saveNote()">
                Update Note
              </button>
            } @else {
              <button mat-flat-button color="primary" [disabled]="!noteContent.trim()" (click)="saveNote()">
                <mat-icon>save</mat-icon> Add Note
              </button>
            }
          </mat-card-actions>
        </mat-card>
      }

      <div class="notes-list">
        @if (notes().length === 0) {
          <div class="empty-notes">
            <mat-icon>description</mat-icon>
            <p>No case notes recorded for this target yet.</p>
          </div>
        } @else {
          @for (note of notes(); track note.id) {
            <mat-card class="note-card">
              <mat-card-header>
                <mat-icon mat-card-avatar class="author-avatar">account_circle</mat-icon>
                <mat-card-title>{{ note.authorName }}</mat-card-title>
                <mat-card-subtitle>{{ note.createdAt | timeAgo }}</mat-card-subtitle>
                <span class="spacer"></span>
                @if (canModifyNote(note)) {
                  <button mat-icon-button (click)="editNote(note)" matTooltip="Edit note">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteNote(note)" matTooltip="Delete note">
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </mat-card-header>
              <mat-card-content>
                <p class="note-text">{{ note.content }}</p>
                @if (note.tags && note.tags.length > 0) {
                  <div class="note-tags">
                    @for (tag of note.tags; track tag) {
                      <span class="tag-chip">#{{ tag }}</span>
                    }
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .case-notes-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }
    .w-full {
      width: 100%;
    }
    .add-note-card {
      background: rgba(17, 24, 39, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
    }
    .notes-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .note-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
    }
    .author-avatar {
      color: #38bdf8;
    }
    .spacer {
      flex: 1;
    }
    .note-text {
      white-space: pre-wrap;
      font-size: 0.92rem;
      line-height: 1.5;
      margin: 8px 0;
    }
    .note-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .tag-chip {
      font-size: 0.75rem;
      padding: 2px 8px;
      background: rgba(56, 189, 248, 0.12);
      color: #38bdf8;
      border-radius: 12px;
      border: 1px solid rgba(56, 189, 248, 0.25);
    }
    .empty-notes {
      text-align: center;
      padding: 32px 16px;
      color: #94a3b8;
      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        margin-bottom: 8px;
        opacity: 0.5;
      }
    }
  `],
})
export class CaseNotesComponent implements OnInit {
  @Input({ required: true }) targetId!: string;
  @Input() targetAlias: string = '';

  readonly authService = inject(AuthService);
  private readonly auditService = inject(AuditService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly notes = signal<CaseNote[]>([]);
  readonly editingNoteId = signal<string | null>(null);

  noteContent = '';
  noteTags = '';

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes(): void {
    const targetNotes = MOCK_CASE_NOTES.filter(n => n.targetId === this.targetId);
    this.notes.set([...targetNotes]);
  }

  canModifyNote(note: CaseNote): boolean {
    if (this.authService.isAdmin()) return true;
    const currentUser = this.authService.currentUser();
    return currentUser ? currentUser.id === note.authorId : false;
  }

  editNote(note: CaseNote): void {
    this.editingNoteId.set(note.id);
    this.noteContent = note.content;
    this.noteTags = note.tags.join(', ');
  }

  cancelEdit(): void {
    this.editingNoteId.set(null);
    this.noteContent = '';
    this.noteTags = '';
  }

  saveNote(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    const tags = this.noteTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const editId = this.editingNoteId();
    if (editId) {
      // Update
      const existing = this.notes().find(n => n.id === editId);
      if (existing) {
        existing.content = this.noteContent.trim();
        existing.tags = tags;
        existing.updatedAt = new Date().toISOString();
        this.notes.update(arr => [...arr]);
        this.auditService.record(
          'NOTE_EDIT',
          user,
          `Edited note on target ${this.targetAlias}`,
          this.targetId,
          this.targetAlias
        );
        this.snackBar.open('Case note updated', 'Close', { duration: 3000 });
      }
      this.cancelEdit();
    } else {
      // Create new
      const newNote: CaseNote = {
        id: `NOTE-${Date.now()}`,
        targetId: this.targetId,
        content: this.noteContent.trim(),
        authorId: user.id,
        authorName: user.displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags,
      };
      MOCK_CASE_NOTES.unshift(newNote);
      this.notes.update(arr => [newNote, ...arr]);
      this.auditService.record(
        'NOTE_ADD',
        user,
        `Added case note to target ${this.targetAlias}`,
        this.targetId,
        this.targetAlias
      );
      this.snackBar.open('Case note added', 'Close', { duration: 3000 });
      this.cancelEdit();
    }
  }

  deleteNote(note: CaseNote): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Case Note',
        message: 'Are you sure you want to delete this case note? This action is logged.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      const user = this.authService.currentUser();
      this.notes.update(arr => arr.filter(n => n.id !== note.id));
      const idx = MOCK_CASE_NOTES.findIndex(n => n.id === note.id);
      if (idx !== -1) MOCK_CASE_NOTES.splice(idx, 1);

      if (user) {
        this.auditService.record(
          'NOTE_DELETE',
          user,
          `Deleted case note from target ${this.targetAlias}`,
          this.targetId,
          this.targetAlias
        );
      }
      this.snackBar.open('Note deleted', 'Close', { duration: 3000 });
    });
  }
}
