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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Evidence, EvidenceType } from '../../core/models/evidence.model';
import { MOCK_EVIDENCE } from '../../core/mock/evidence.mock';
import { AuthService } from '../../core/services/auth.service';
import { AuditService } from '../../core/services/audit.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-evidence',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TimeAgoPipe,
  ],
  template: `
    <div class="evidence-container">
      @if (authService.isOfficer()) {
        <div class="upload-section">
          <input
            type="file"
            #fileInput
            style="display: none"
            (change)="onFileSelected($event)"
          />
          <button mat-flat-button color="primary" (click)="fileInput.click()">
            <mat-icon>upload_file</mat-icon> Upload Evidence Item
          </button>
          <span class="upload-hint">Simulated secure evidence vault (CCTV, audio, files)</span>
        </div>
      }

      <div class="evidence-list">
        @if (evidenceList().length === 0) {
          <div class="empty-evidence">
            <mat-icon>folder_open</mat-icon>
            <p>No evidence attachments linked to this target profile.</p>
          </div>
        } @else {
          @for (item of evidenceList(); track item.id) {
            <mat-card class="evidence-card">
              <mat-card-header>
                <mat-icon mat-card-avatar [class]="'type-' + item.fileType.toLowerCase()">
                  {{ getFileIcon(item.fileType) }}
                </mat-icon>
                <mat-card-title class="file-name">{{ item.fileName }}</mat-card-title>
                <mat-card-subtitle>
                  {{ formatSize(item.fileSize) }} • Uploaded by {{ item.uploadedBy }} • {{ item.uploadedAt | timeAgo }}
                </mat-card-subtitle>
                <span class="spacer"></span>
                @if (authService.isAdmin()) {
                  <button mat-icon-button color="warn" (click)="deleteEvidence(item)" matTooltip="Remove evidence">
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </mat-card-header>
              <mat-card-content>
                <p class="description">{{ item.description }}</p>
                <div class="tags">
                  @for (tag of item.tags; track tag) {
                    <span class="tag">#{{ tag }}</span>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .evidence-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 0;
    }
    .upload-section {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(17, 24, 39, 0.6);
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-radius: 8px;
    }
    .upload-hint {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .evidence-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .evidence-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
    }
    .file-name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.95rem;
    }
    .spacer {
      flex: 1;
    }
    .description {
      font-size: 0.88rem;
      margin: 8px 0;
      color: #cbd5e1;
    }
    .tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .tag {
      font-size: 0.75rem;
      padding: 2px 8px;
      background: rgba(148, 163, 184, 0.12);
      color: #94a3b8;
      border-radius: 12px;
    }
    .type-image { color: #38bdf8; }
    .type-video { color: #f43f5e; }
    .type-document { color: #f59e0b; }
    .type-audio { color: #10b981; }
    .type-other { color: #94a3b8; }
    .empty-evidence {
      text-align: center;
      padding: 32px 16px;
      color: #94a3b8;
      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        opacity: 0.5;
        margin-bottom: 8px;
      }
    }
  `],
})
export class EvidenceComponent implements OnInit {
  @Input({ required: true }) targetId!: string;
  @Input() targetAlias: string = '';

  readonly authService = inject(AuthService);
  private readonly auditService = inject(AuditService);
  private readonly snackBar = inject(MatSnackBar);

  readonly evidenceList = signal<Evidence[]>([]);

  ngOnInit(): void {
    this.loadEvidence();
  }

  loadEvidence(): void {
    const list = MOCK_EVIDENCE.filter(e => e.targetId === this.targetId);
    this.evidenceList.set([...list]);
  }

  getFileIcon(type: EvidenceType): string {
    switch (type) {
      case 'IMAGE': return 'image';
      case 'VIDEO': return 'videocam';
      case 'DOCUMENT': return 'description';
      case 'AUDIO': return 'mic';
      default: return 'attachment';
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const user = this.authService.currentUser();
    if (!user) return;

    let type: EvidenceType = 'OTHER';
    if (file.type.startsWith('image/')) type = 'IMAGE';
    else if (file.type.startsWith('video/')) type = 'VIDEO';
    else if (file.type.startsWith('audio/')) type = 'AUDIO';
    else if (file.type.includes('pdf') || file.type.includes('text') || file.type.includes('doc')) type = 'DOCUMENT';

    const newEvidence: Evidence = {
      id: `EVD-${Date.now()}`,
      targetId: this.targetId,
      fileName: file.name,
      fileType: type,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      description: `Uploaded from field station: ${file.name}`,
      uploadedBy: user.displayName,
      uploadedAt: new Date().toISOString(),
      tags: ['field-upload', type.toLowerCase()],
    };

    MOCK_EVIDENCE.unshift(newEvidence);
    this.evidenceList.update(arr => [newEvidence, ...arr]);
    this.auditService.record(
      'EVIDENCE_UPLOAD',
      user,
      `Uploaded evidence ${file.name} for target ${this.targetAlias}`,
      this.targetId,
      this.targetAlias
    );
    this.snackBar.open(`Evidence attached: ${file.name}`, 'Close', { duration: 3000 });
    input.value = '';
  }

  deleteEvidence(item: Evidence): void {
    const user = this.authService.currentUser();
    this.evidenceList.update(arr => arr.filter(e => e.id !== item.id));
    const idx = MOCK_EVIDENCE.findIndex(e => e.id === item.id);
    if (idx !== -1) MOCK_EVIDENCE.splice(idx, 1);

    if (user) {
      this.auditService.record(
        'EVIDENCE_UPLOAD',
        user,
        `Removed evidence attachment ${item.fileName}`,
        this.targetId,
        this.targetAlias
      );
    }
    this.snackBar.open('Evidence removed', 'Close', { duration: 3000 });
  }
}
