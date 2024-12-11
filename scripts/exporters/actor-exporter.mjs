import { AbstractExporter } from './abstract-exporter.mjs';
import { ItemExporter } from './item-exporter.mjs';

export class ActorExporter extends AbstractExporter {
  static getDocumentData(document, customMapping, useItemMapping) {
    const { name, prototypeToken: { name: tokenName } = {}, system: { details: { biography: { value: description } = {} } } } = document;
    const documentData = { name, tokenName: tokenName ?? name };

    if (description) documentData.description = description;

    AbstractExporter._addCustomMapping(customMapping.actor, document, documentData);

    if (AbstractExporter._hasContent(document.items)) {
      documentData.items = {};
      document.items.forEach(item => {
        const itemData = ItemExporter.getDocumentData(foundry.utils.duplicate(item), useItemMapping ? customMapping.item : {});
        const key = documentData.items[item.name] && !foundry.utils.objectsEqual(documentData.items[item.name], itemData) ? item._id : item.name;
        documentData.items[key] = itemData;
      });
    }

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
      const documentData = ActorExporter.getDocumentData(
        await this.pack.getDocument(indexDocument._id),
        this.options.customMapping,
        true
      );
      
      let key = this.options.useIdAsKey ? indexDocument._id : indexDocument.name;
      key = this.dataset.entries[key] && !foundry.utils.objectsEqual(this.dataset.entries[key], documentData) ? indexDocument._id : key;
      
      this.dataset.entries[key] = foundry.utils.mergeObject(documentData, this.existingContent[key] ?? {});

      this._stepProgressBar();
    }
  }
}
