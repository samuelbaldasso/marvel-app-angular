// src/app/features/characters/components/character-card/character-card.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Character } from '../../../../core/models/character.model';
import { ThumbnailPipe } from '../../../../shared/pipes/thumbnail.pipe';

@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ThumbnailPipe
  ],
  templateUrl: './character-card.component.html',
  styleUrl: './character-card.component.scss'
})
export class CharacterCardComponent {
  @Input() character!: Character;
  @Output() deleteRequest = new EventEmitter<Event>();

  onDelete(event: Event): void {
    event.stopPropagation();
    this.deleteRequest.emit(event);
  }
}
