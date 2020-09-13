import axios from 'axios';
import cheerio from 'cheerio';
import {Tabletojson} from 'tabletojson';
import fs from 'fs/promises';

(async () => {
  const json = await Tabletojson.convertUrl('http://biorg.cs.fiu.edu/pluma/plugins/', { stripHtmlFromCells: false });

  let plugins = [];

  for (let i = 2; i < json.length; i++) {
    const variant = json[i];

    for (let j = 1; j < variant.length; j++) {
      let m = new Map();

      const nameAndUrl = /href="([\w:\/\.]+)">([\w]+)/.exec(variant[j]['0']);

      //@ts-ignore
      if (nameAndUrl) {
        m.set('name', nameAndUrl[2]);
        m.set('github_url', nameAndUrl[1]);
      }

      if (i < 11) {
        m.set('category_id', i-1);
      } else {
        m.set('category_id', 99);
      }

      m.set('description', variant[j]['1']);

      const language = variant[j]['2'];

      if (language == 'Python') {
        m.set('language_id', 1);
      } else if (language == 'R') {
        m.set('language_id', 4);
      } else if (language == 'C++') {
        m.set('language_id', 3);
      } else if (language == 'Perl') {
        m.set('language_id', 2);
      } else if (language == 'CUDA') {
        m.set('language_id', 5);
      } else {
        process.exit(1);
      }

      plugins.push(m);
    }
  }

  const date = new Date();

  const fh = await fs.open(`${date.toISOString()}.sql`, 'w');

  await fh.write(`INSERT INTO "plugins" ("name", "category_id", "description", "github_url", "language_id")
VALUES\n`);

  for(let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];

    let sql = '';

    if (i+1 == plugins.length) {
      sql = `  ('${plugin.get('name')}', ${plugin.get('category_id')}, '${plugin.get('description')}', '${plugin.get('github_url')}', ${plugin.get('language_id')});\n`
    } else {
      sql = `  ('${plugin.get('name')}', ${plugin.get('category_id')}, '${plugin.get('description')}', '${plugin.get('github_url')}', ${plugin.get('language_id')}),\n`
    }

    await fh.write(sql)
  }
})();
