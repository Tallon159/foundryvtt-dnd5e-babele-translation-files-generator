import { AbstractExporter } from './abstract-exporter.mjs';
import { deepEqual } from '../helpers/compare.mjs';

export class ItemExporter extends AbstractExporter {
  static getDocumentData(document, customMapping) {
    const { name, system: { description: { value: descriptionValue } } } = document;
    const documentData = { name };

    if (descriptionValue) documentData.description = descriptionValue;

    AbstractExporter._addCustomMapping(customMapping, document, documentData);

    if (AbstractExporter._hasContent(document.effects)) {
      documentData.effects = Object.fromEntries(
        document.effects.map(({ name, description }) => [
          name,
          { name, ...(description && { description }) }
        ])
      );
    }

    return documentData;
  }

  async _processDataset() {
    const documents = await this.pack.getIndex();

    for (const indexDocument of documents) {
      const documentData = ItemExporter.getDocumentData(
        foundry.utils.duplicate(await this.pack.getDocument(indexDocument._id)), // duplicate fix real name from document
        this.options.customMapping.item,
      );

      let key = this.options.useIdAsKey ? indexDocument._id : indexDocument.name;
      key = this.dataset.entries[key] && !deepEqual(this.dataset.entries[key], documentData) ? indexDocument._id : key;

      this.dataset.entries[key] = foundry.utils.mergeObject(documentData, this.existingContent[key] ?? {});

      this._stepProgressBar();
    }
  }
}
