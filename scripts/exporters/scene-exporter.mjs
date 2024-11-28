import { AbstractExporter } from './abstract-exporter.mjs';
import { ItemExporter } from './item-exporter.mjs';
import { deepEqual } from '../helpers/compare.mjs';

export class SceneExporter extends AbstractExporter {
  static getDocumentData(document, customMapping) {
    const documentData = { name: document.name };

    AbstractExporter._addCustomMapping(customMapping.scene, document, documentData);

    if (AbstractExporter._hasContent(document.drawings)) {
      documentData.drawings = Object.fromEntries(
        document.drawings
        .filter(({ text }) => text.length)
        .map(({ text }) => [text, text])
      );
    }

    if (AbstractExporter._hasContent(document.notes)) {
      for (const { text } of document.notes) {
        if (text.length) {
          documentData.notes = documentData.notes ?? {};
          documentData.notes[text] = text;
        }
      }
    }

    if (AbstractExporter._hasContent(document.tokens)) {
      for (const { name: tokenName, delta } of document.tokens) {
        const { name: deltaName, system, items, effects } = delta;
        const description = system?.details?.biography?.value;

        if (!deltaName && !description && !AbstractExporter._hasContent(items) && !AbstractExporter._hasContent(effects)) continue;

        documentData.deltaTokens = documentData.deltaTokens ?? {};
        documentData.deltaTokens[tokenName] = {};

        if (deltaName) documentData.deltaTokens[tokenName].name = deltaName;
        
        if (description) documentData.deltaTokens[tokenName].description = description;
        
        if (AbstractExporter._hasContent(items)) {
          documentData.deltaTokens[tokenName].items = {};
          for (const item of items) {
            if (item.name) {
              documentData.deltaTokens[tokenName].items[item.name] = ItemExporter.getDocumentData(item, customMapping.item ?? customMapping);
            }
          }
        }

        if (AbstractExporter._hasContent(effects)) {
          documentData.deltaTokens[tokenName].effects = {};
          for (const { name, description } of effects) {
            if (name) {
              documentData.deltaTokens[tokenName].effects[name] = { name };
              if (description) documentData.deltaTokens[tokenName].effects[name].description = description;
            }
          }
        }
      }
    }
    
    return documentData;
  }

  async _processDataset() {
    const documents = await this.pack.getIndex();

    for (const indexDocument of documents) {
      const documentData = SceneExporter.getDocumentData(
        await this.pack.getDocument(indexDocument._id),
        this.options.customMapping
      );

      let key = this.options.useIdAsKey ? indexDocument._id : indexDocument.name;
      key = this.dataset.entries[key] && !deepEqual(this.dataset.entries[key], documentData) ? indexDocument._id : key;

      this.dataset.entries[key] = foundry.utils.mergeObject(documentData, this.existingContent[key] ?? {});

      this._stepProgressBar();
    }
  }
}
