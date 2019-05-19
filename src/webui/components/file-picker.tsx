import * as React from 'react';

interface FilePickerProps {
  onTextRead?(text: string): void;
}

export class FilePicker extends React.Component<FilePickerProps, {}> {
  handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const input = ev.target as HTMLInputElement;
    const file0 = input.files![0] as File;
    const { onTextRead } = this.props;
    if (file0 && onTextRead) {
      const reader = new FileReader();
      reader.addEventListener('load', loaded => {
        onTextRead(reader.result as string);
      });
      reader.readAsText(file0, 'utf8');
    }
  };

  render() {
    return <input type="file" onChange={this.handleChange} />;
  }
}
