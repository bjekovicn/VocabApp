import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
})
export class FileUploadComponent {
  public readonly selectedFile = input<File | null>(null);
  public readonly fileSelected = output<File>();

  public handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.fileSelected.emit(input.files[0]);
    }
  }
}
