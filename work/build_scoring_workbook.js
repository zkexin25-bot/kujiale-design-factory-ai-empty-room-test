const ExcelJS = require('exceljs');
const path = require('path');

(async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Codex';
  workbook.created = new Date();

  const outputPath = path.resolve('C:/Users/Administrator/Documents/Codex/2026-08-11/jie/outputs/空房间测试人工打分模板.xlsx');

  const intro = workbook.addWorksheet('说明', { views: [{ showGridLines: false }] });
  const wide = workbook.addWorksheet('宽表', { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] });
  const longSheet = workbook.addWorksheet('长表', { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] });

  intro.mergeCells('A1:F1');
  intro.mergeCells('A3:F3');
  intro.mergeCells('A8:F8');
  intro.mergeCells('A14:F14');
  intro.getCell('A1').value = '空房间测试人工打分模板';
  intro.getCell('A3').value = '使用方式';
  intro.getCell('A8').value = '评分标准';
  intro.getCell('A14').value = '建议：材质色差 / 材质品类变化 / 光影过强 / 结构与物品变化 / 总评 都使用 A/B/C/D 填写。';
  [
    '1. 先在对照页面里看图，再回到本表打分。',
    '2. 优先使用“宽表”工作表，一行就是一个场景。',
    '3. 如果后面要做统计汇总，再使用“长表”工作表。',
    '',
    'A = 基本正确',
    'B = 轻微变化，但无所谓',
    'C = 有变化，但不影响事实表达',
    'D = 严重错误'
  ].forEach((text, idx) => {
    intro.getCell(`A${4 + idx}`).value = text;
  });
  intro.columns = [
    { width: 28 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }
  ];
  intro.eachRow((row) => {
    row.height = 24;
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD6DEE8' } },
        left: { style: 'thin', color: { argb: 'FFD6DEE8' } },
        bottom: { style: 'thin', color: { argb: 'FFD6DEE8' } },
        right: { style: 'thin', color: { argb: 'FFD6DEE8' } },
      };
    });
  });
  ['A1','A3','A8'].forEach((addr) => {
    const c = intro.getCell(addr);
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: addr === 'A1' ? 'FF123B63' : 'FFDCE9F8' } };
    c.font = { bold: true, color: { argb: addr === 'A1' ? 'FFFFFFFF' : 'FF123B63' }, size: addr === 'A1' ? 16 : 12 };
    c.alignment = { horizontal: addr === 'A1' ? 'center' : 'left', vertical: 'middle' };
  });
  intro.getCell('A14').font = { color: { argb: 'FF243B53' }, italic: true };

  const wideHeaders = [
    'scene_id','original_file',
    'AI美化线上版文件','AI美化线上版_材质色差','AI美化线上版_材质品类变化','AI美化线上版_光影过强','AI美化线上版_结构与物品变化','AI美化线上版_总评','AI美化线上版_备注',
    'AI美化LoRA版文件','AI美化LoRA版_材质色差','AI美化LoRA版_材质品类变化','AI美化LoRA版_光影过强','AI美化LoRA版_结构与物品变化','AI美化LoRA版_总评','AI美化LoRA版_备注',
    '实时增强结果版文件','实时增强结果版_材质色差','实时增强结果版_材质品类变化','实时增强结果版_光影过强','实时增强结果版_结构与物品变化','实时增强结果版_总评','实时增强结果版_备注',
    '实时增强LoRA版文件','实时增强LoRA版_材质色差','实时增强LoRA版_材质品类变化','实时增强LoRA版_光影过强','实时增强LoRA版_结构与物品变化','实时增强LoRA版_总评','实时增强LoRA版_备注'
  ];
  wide.addRow(wideHeaders);
  for (let i = 1; i <= 45; i += 1) {
    const id = String(i).padStart(2, '0');
    wide.addRow([
      id,
      `空房间测试${id}.jpg`,
      `空房间ai美化线上版${id}.jpg`, '', '', '', '', '', '',
      `空房间ai美化测试${id}.jpg`, '', '', '', '', '', '',
      `空房间实时增强测试${id}.jpg`, '', '', '', '', '', '',
      `空房间实时增强lora测试${id}.jpg`, '', '', '', '', '', ''
    ]);
  }

  const wideWidths = [10,18,22,13,15,13,17,10,22,20,13,15,13,17,10,22,20,13,15,13,17,10,22,22,13,15,13,17,10,22];
  wide.columns.forEach((col, idx) => { col.width = wideWidths[idx] || 14; });

  const longHeaders = ['scene_id','original_file','test_set','test_file','材质色差','材质品类变化','光影过强','结构与物品变化','总评','问题备注'];
  longSheet.addRow(longHeaders);
  const sets = [
    ['AI美化线上版', '空房间ai美化线上版'],
    ['AI美化LoRA版', '空房间ai美化测试'],
    ['实时增强结果版', '空房间实时增强测试'],
    ['实时增强LoRA版', '空房间实时增强lora测试'],
  ];
  for (let i = 1; i <= 45; i += 1) {
    const id = String(i).padStart(2, '0');
    for (const [testSet, prefix] of sets) {
      longSheet.addRow([id, `空房间测试${id}.jpg`, testSet, `${prefix}${id}.jpg`, '', '', '', '', '', '']);
    }
  }
  longSheet.columns = [
    { width: 10 }, { width: 18 }, { width: 16 }, { width: 22 },
    { width: 13 }, { width: 15 }, { width: 13 }, { width: 17 }, { width: 10 }, { width: 28 }
  ];

  const styleHeader = (sheet, endCol) => {
    const header = sheet.getRow(1);
    header.height = 32;
    for (let i = 1; i <= endCol; i += 1) {
      const cell = header.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123B63' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD6DEE8' } },
        left: { style: 'thin', color: { argb: 'FFD6DEE8' } },
        bottom: { style: 'thin', color: { argb: 'FFD6DEE8' } },
        right: { style: 'thin', color: { argb: 'FFD6DEE8' } },
      };
    }
  };

  const styleBody = (sheet) => {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 22;
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD6DEE8' } },
          left: { style: 'thin', color: { argb: 'FFD6DEE8' } },
          bottom: { style: 'thin', color: { argb: 'FFD6DEE8' } },
          right: { style: 'thin', color: { argb: 'FFD6DEE8' } },
        };
      });
    });
  };

  styleHeader(wide, wide.columnCount);
  styleBody(wide);
  styleHeader(longSheet, longSheet.columnCount);
  styleBody(longSheet);

  const addValidation = (sheet, range) => {
    const [startCol, startRow, endCol, endRow] = range;
    for (let row = startRow; row <= endRow; row += 1) {
      for (let col = startCol; col <= endCol; col += 1) {
        sheet.getCell(row, col).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"A,B,C,D"']
        };
      }
    }
  };

  [4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29].forEach((col) => {
    addValidation(wide, [col, 2, col, 46]);
  });
  addValidation(longSheet, [5, 2, 9, 181]);

  await workbook.xlsx.writeFile(outputPath);
  console.log(outputPath);
})();
