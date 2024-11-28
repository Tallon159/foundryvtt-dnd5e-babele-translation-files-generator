import { AbstractExporter } from './abstract-exporter.mjs';
import { deepEqual } from '../helpers/compare.mjs';

export class JournalEntryExporter extends AbstractExporter {
  static getDocumentData(document) {
    const documentData = { name: document.name };

    if (AbstractExporter._hasContent(document.pages)) {
      documentData.pages = Object.fromEntries(
        document.pages.map(({
          name,
          image: { caption } = {},
          src,
          video: { width, height } = {},
          text: { content: text } = {},
          system : { tooltip } = {}
        }) => [
          name, 
          { 
            name,
            ...(caption && { caption }),
            ...(src && { src }),
            ...(width && { width }),
            ...(height && { height }),
            ...(text && { text }),
            ...(tooltip && { tooltip })
          }
        ])
      );
    }

    return documentData;
  }

  async _processDataset() {
    const documents = await this.pack.getIndex();

    for (const indexDocument of documents) {
      const documentData = JournalEntryExporter.getDocumentData(await this.pack.getDocument(indexDocument._id));

      let key = this.options.useIdAsKey ? indexDocument._id : indexDocument.name;
      key = this.dataset.entries[key] && !deepEqual(this.dataset.entries[key], documentData) ? indexDocument._id : key;
      
      this.dataset.entries[key] = foundry.utils.mergeObject(documentData, this.existingContent[key] ?? {});

      this._stepProgressBar();
    }
  }
}
