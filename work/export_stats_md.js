const fs = require('fs');

const outputPath = 'C:/Users/Administrator/Documents/Codex/2026-08-11/jie/outputs/空房间测试统计页导出.md';
const dataPath = 'C:/Users/Administrator/Documents/Codex/2026-08-11/jie/outputs/data/room_compare_scores.json';
const scores = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const TOTAL_SCENES = 45;
const testSets = [
  { key: 'beautifyOnline', label: 'AI 美化线上版' },
  { key: 'beautifyLora', label: 'AI 美化 LoRA 版' },
  { key: 'realtime', label: '实时增强结果版' },
  { key: 'realtimeLora', label: '实时增强 LoRA 版' }
];
const comparePairs = [
  {
    title: 'AI 美化：线上版 vs LoRA',
    left: { key: 'beautifyOnline', label: 'AI 美化线上版' },
    right: { key: 'beautifyLora', label: 'AI 美化 LoRA 版' }
  },
  {
    title: '实时增强：结果版 vs LoRA',
    left: { key: 'realtime', label: '实时增强结果版' },
    right: { key: 'realtimeLora', label: '实时增强 LoRA 版' }
  }
];
const issueRules = [
  { label: '颜色/色差', patterns: [/颜色|色差|偏色|变紫|变深|变浅|变白|变黑|发蓝|发紫|色温/] },
  { label: '材质错误', patterns: [/材质|瓷砖|地板|石材|美缝|纹理|墙材|材质感/] },
  { label: '光影/曝光', patterns: [/曝光|光斑|反光|光影|射灯|灯带|炫光|格纹光|透光|强光/] },
  { label: '结构/物体幻觉', patterns: [/柜子|把手|结构|洗手液|灯泡|马桶|多了|凭空|墙变/] },
  { label: '细节丢失/过增强', patterns: [/消掉|花纹|封模线|结构线|坑|增强|抹掉|过强|过度/] }
];

const entries = Object.entries(scores).map(([key, value]) => {
  const match = key.match(/^(.*)_(\d{2})$/);
  if (!match) return null;
  const set = testSets.find(item => item.key === match[1]);
  if (!set) return null;
  return {
    setKey: set.key,
    setLabel: set.label,
    sceneId: Number(match[2]),
    grade: value.grade || '',
    note: (value.note || '').trim()
  };
}).filter(Boolean);

function percent(part, whole) {
  return whole ? `${((part / whole) * 100).toFixed(1)}%` : '0.0%';
}

function gradeCounts(list) {
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  list.forEach(item => {
    if (counts[item.grade] != null) counts[item.grade] += 1;
  });
  return counts;
}

function detectIssues(note) {
  const hits = [];
  for (const rule of issueRules) {
    if (rule.patterns.some(pattern => pattern.test(note))) hits.push(rule.label);
  }
  return hits.length ? hits : ['其他备注'];
}

function issueCounts(list) {
  const map = new Map();
  list.filter(item => item.note).forEach(item => {
    detectIssues(item.note).forEach(label => map.set(label, (map.get(label) || 0) + 1));
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

const graded = entries.filter(item => item.grade);
const noted = entries.filter(item => item.note);
const totalSlots = TOTAL_SCENES * testSets.length;
const totalGrades = gradeCounts(graded);
const passCount = totalGrades.A + totalGrades.B + totalGrades.C;

let md = '';
md += '# 空房间测试统计页导出\n\n';
md += `导出时间：${new Date().toLocaleString('zh-CN', { hour12: false })}\n`;
md += `数据来源：${dataPath}\n\n`;
md += '## 总览\n\n';
md += `- 已评分数量：${graded.length} / ${totalSlots}（覆盖率 ${percent(graded.length, totalSlots)}）\n`;
md += `- 严重错误 D：${totalGrades.D}（占已评分样本 ${percent(totalGrades.D, graded.length)}）\n`;
md += `- 可接受 A/B/C：${passCount}（占已评分样本 ${percent(passCount, graded.length)}）\n`;
md += `- 已写备注：${noted.length}\n\n`;

md += '## 测试集结果与比例\n\n';
md += '| 测试集 | 评分覆盖率 | 已评分 | A | B | C | D | D 比例 |\n';
md += '|---|---:|---:|---:|---:|---:|---:|---:|\n';
for (const set of testSets) {
  const setEntries = entries.filter(item => item.setKey === set.key);
  const setGraded = setEntries.filter(item => item.grade);
  const counts = gradeCounts(setGraded);
  md += `| ${set.label} | ${percent(setGraded.length, TOTAL_SCENES)} | ${setGraded.length}/${TOTAL_SCENES} | ${counts.A} | ${counts.B} | ${counts.C} | ${counts.D} | ${percent(counts.D, setGraded.length)} |\n`;
}
md += '\n';

md += '## 同类关键词对照\n\n';
for (const pair of comparePairs) {
  const leftEntries = entries.filter(item => item.setKey === pair.left.key);
  const rightEntries = entries.filter(item => item.setKey === pair.right.key);
  const leftGraded = leftEntries.filter(item => item.grade);
  const rightGraded = rightEntries.filter(item => item.grade);
  const leftCounts = gradeCounts(leftGraded);
  const rightCounts = gradeCounts(rightGraded);
  const leftPass = leftCounts.A + leftCounts.B + leftCounts.C;
  const rightPass = rightCounts.A + rightCounts.B + rightCounts.C;
  const leftIssues = issueCounts(leftEntries).slice(0, 6);
  const rightIssues = issueCounts(rightEntries).slice(0, 6);

  md += `### ${pair.title}\n\n`;
  md += `- ${pair.left.label}：通过率 ${percent(leftPass, leftGraded.length)}，D 比例 ${percent(leftCounts.D, leftGraded.length)}，已写备注 ${leftEntries.filter(item => item.note).length}\n`;
  md += `- ${pair.right.label}：通过率 ${percent(rightPass, rightGraded.length)}，D 比例 ${percent(rightCounts.D, rightGraded.length)}，已写备注 ${rightEntries.filter(item => item.note).length}\n\n`;
  md += '| 关键词对照 | 无 LoRA | 有 LoRA |\n';
  md += '|---|---|---|\n';

  const maxLen = Math.max(leftIssues.length, rightIssues.length);
  for (let i = 0; i < maxLen; i += 1) {
    const left = leftIssues[i] ? `${leftIssues[i][0]} (${leftIssues[i][1]})` : '';
    const right = rightIssues[i] ? `${rightIssues[i][0]} (${rightIssues[i][1]})` : '';
    md += `| 排名 ${i + 1} | ${left} | ${right} |\n`;
  }
  md += '\n';
}

md += '## 整体高频问题\n\n';
const overallIssues = issueCounts(entries);
if (overallIssues.length) {
  overallIssues.slice(0, 10).forEach(([label, count], idx) => {
    md += `${idx + 1}. ${label}：${count} 次\n`;
  });
} else {
  md += '暂无可统计的备注内容。\n';
}
md += '\n';

md += '## 各测试集主要问题\n\n';
for (const set of testSets) {
  const issues = issueCounts(entries.filter(item => item.setKey === set.key));
  md += `### ${set.label}\n\n`;
  if (!issues.length) {
    md += '暂无备注。\n\n';
    continue;
  }
  issues.slice(0, 8).forEach(([label, count], idx) => {
    md += `${idx + 1}. ${label}：${count} 次\n`;
  });
  md += '\n';
}

md += '## 备注明细\n\n';
for (const set of testSets) {
  const items = entries
    .filter(item => item.setKey === set.key && (item.note || item.grade))
    .sort((a, b) => a.sceneId - b.sceneId);
  md += `### ${set.label}\n\n`;
  if (!items.length) {
    md += '暂无记录。\n\n';
    continue;
  }
  items.forEach(item => {
    md += `- 场景 ${String(item.sceneId).padStart(2, '0')} · ${item.grade || '未打分'}：${item.note || '已评分，暂未填写备注。'}\n`;
  });
  md += '\n';
}

fs.writeFileSync(outputPath, md, 'utf8');
console.log(outputPath);
