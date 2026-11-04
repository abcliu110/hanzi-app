/**
 * hanzi-app 动画引擎 v1.0 - 数据编译动画
 * 
 * 第一层跃升：从手编动画到「数据编译动画」
 * 5 个机制原语，吃结构化数据，自动生成 SMIL SVG 动画
 * 
 * 数据格式：
 * {
 *   primitive: 'split' | 'replace' | 'clash' | 'path' | 'sequence',
 *   data: { ... }  // 每个原语特定的数据
 * }
 * 
 * 输出：SVG 字符串（含 SMIL 动画），可直接嵌入图示字段
 */

const AnimEngine = (function() {
  'use strict';

  // 语义颜色
  const C = {
    green: '#4a7a59',   // 正确/重点/平
    blue: '#4a7a8c',    // 次要/轨迹
    red: '#b85a52',     // 错误/警示/仄
    yellow: '#b8892e',  // 强调
    ink: '#2c3328',
    muted: '#6b7566'
  };

  // 通用：转义 XML
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * 原语1：拆/合 (split)
   * 用于：偏旁拆分、句子成分拆分
   * 数据：{parts: [{text, color, dx, dy, label}], centerX, centerY}
   * parts: 部件列表，每个有文字、颜色、位移、标注
   */
  function split(data) {
    const {parts, centerX = 320, centerY = 100} = data;
    let svg = `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">`;
    let t = 0.5;
    
    // 原字（先显示，后淡出）
    const fullText = parts.map(p => p.text).join('');
    svg += `<text x="${centerX}" y="${centerY}" text-anchor="middle" font-size="48" fill="${C.ink}" id="fullChar">${esc(fullText)}`;
    svg += `<animate attributeName="opacity" values="1;0" dur="0.4s" begin="${t}s" fill="freeze"/></text>`;
    t += 0.5;
    
    // 部件散开（错开时间，避免初始重叠）
    parts.forEach((p, i) => {
      const x = centerX + (p.dx || 0);
      const y = centerY + (p.dy || 0);
      const bt = t + i * 0.4; // 每个部件错开0.4秒出现
      svg += `<g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.3s" begin="${bt}s" fill="freeze"/>`;
      svg += `<text x="${centerX}" y="${centerY}" text-anchor="middle" font-size="36" fill="${p.color || C.green}">${esc(p.text)}`;
      svg += `<animateTransform attributeName="transform" type="translate" values="0,0;${p.dx||0},${p.dy||0}" dur="0.8s" begin="${bt}s" fill="freeze"/></text>`;
      if (p.label) {
        svg += `<text x="${x}" y="${y+40}" text-anchor="middle" font-size="13" fill="${C.muted}">${esc(p.label)}</text>`;
      }
      svg += `</g>`;
    });
    t += 1.2 + parts.length * 0.4;
    
    // 合回
    svg += `<text x="${centerX}" y="${centerY}" text-anchor="middle" font-size="48" fill="${C.ink}" opacity="0">${esc(fullText)}`;
    svg += `<animate attributeName="opacity" values="0;1" dur="0.4s" begin="${t}s" fill="freeze"/></text>`;
    
    svg += `</svg>`;
    return svg;
  }

  /**
   * 原语2：替换 (replace)
   * 用于：把字句↔被字句、时间词替换、词性替换
   * 数据：{before: {tokens}, after: {tokens}, highlight}
   */
  function replace(data) {
    const {before, after, note} = data;
    let svg = `<svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">`;
    
    // Before
    svg += `<text x="320" y="60" text-anchor="middle" font-size="20" fill="${C.ink}">${esc(before.text)}`;
    svg += `<animate attributeName="opacity" values="1;0" dur="0.4s" begin="1.0s" fill="freeze"/></text>`;
    
    // 箭头
    svg += `<path d="M320,90 L320,120" stroke="${C.blue}" stroke-width="3" stroke-linecap="round" opacity="0">`;
    svg += `<animate attributeName="opacity" values="0;1" dur="0.3s" begin="1.2s" fill="freeze"/></path>`;
    
    // After
    svg += `<text x="320" y="160" text-anchor="middle" font-size="20" fill="${C.green}" font-weight="bold" opacity="0">${esc(after.text)}`;
    svg += `<animate attributeName="opacity" values="0;1" dur="0.4s" begin="1.5s" fill="freeze"/></text>`;
    
    if (note) {
      svg += `<text x="320" y="190" text-anchor="middle" font-size="13" fill="${C.muted}" opacity="0">${esc(note)}`;
      svg += `<animate attributeName="opacity" values="0;1" dur="0.4s" begin="2.0s" fill="freeze"/></text>`;
    }
    
    svg += `</svg>`;
    return svg;
  }

  /**
   * 原语3：对撞 (clash)
   * 用于：正误句对比、病句纠错
   * 数据：{wrong: {text}, right: {text}, reason}
   */
  function clash(data) {
    const {wrong, right, reason} = data;
    let svg = `<svg viewBox="0 0 640 280" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">`;
    
    // 错句（红，抖动后碎裂）
    svg += `<g id="wrongG"><text x="320" y="80" text-anchor="middle" font-size="20" fill="${C.red}">${esc(wrong.text)}</text>`;
    svg += `<text x="320" y="105" text-anchor="middle" font-size="13" fill="${C.red}">✘ ${esc(wrong.note || '错误')}</text>`;
    // 抖动
    svg += `<animateTransform attributeName="transform" type="translate" values="0,0;-5,0;5,0;-5,0;0,0" dur="0.4s" begin="1.0s" fill="freeze"/>`;
    // 碎裂淡出
    svg += `<animate attributeName="opacity" values="1;0" dur="0.5s" begin="1.5s" fill="freeze"/></g>`;
    
    // 对勾
    svg += `<text x="320" y="150" text-anchor="middle" font-size="32" fill="${C.green}" opacity="0">✓`;
    svg += `<animate attributeName="opacity" values="0;1" dur="0.3s" begin="2.0s" fill="freeze"/></text>`;
    
    // 正句（绿）
    svg += `<text x="320" y="200" text-anchor="middle" font-size="20" fill="${C.green}" font-weight="bold" opacity="0">${esc(right.text)}`;
    svg += `<animate attributeName="opacity" values="0;1" dur="0.4s" begin="2.2s" fill="freeze"/></text>`;
    
    if (reason) {
      svg += `<text x="320" y="240" text-anchor="middle" font-size="13" fill="${C.muted}" opacity="0">${esc(reason)}`;
      svg += `<animate attributeName="opacity" values="0;1" dur="0.4s" begin="2.6s" fill="freeze"/></text>`;
    }
    
    svg += `</svg>`;
    return svg;
  }

  /**
   * 原语4：路径 (path)
   * 用于：四声曲线、"于"的方向、时间轴
   * 数据：{path: "M...", points: [{x, y, label, color}], ball: bool}
   */
  function path(data) {
    const {path: d, points = [], label} = data;
    let svg = `<svg viewBox="0 0 640 280" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">`;
    
    // 路径自己画出来
    const len = 500; // 估算
    svg += `<path d="${d}" fill="none" stroke="${C.blue}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${len}">`;
    svg += `<animate attributeName="stroke-dashoffset" values="${len};0" dur="1.5s" begin="0.5s" fill="freeze"/></path>`;
    
    // 点
    points.forEach((p, i) => {
      const t = 0.8 + i * 0.4;
      svg += `<circle cx="${p.x}" cy="${p.y}" r="8" fill="${p.color || C.green}" opacity="0">`;
      svg += `<animate attributeName="opacity" values="0;1" dur="0.3s" begin="${t}s" fill="freeze"/></circle>`;
      if (p.label) {
        svg += `<text x="${p.x}" y="${p.y - 15}" text-anchor="middle" font-size="12" fill="${C.ink}" opacity="0">${esc(p.label)}`;
        svg += `<animate attributeName="opacity" values="0;1" dur="0.3s" begin="${t+0.2}s" fill="freeze"/></text>`;
      }
    });
    
    // 小球沿路径运动
    if (data.ball !== false) {
      svg += `<circle r="6" fill="${C.red}" opacity="0">`;
      svg += `<animate attributeName="opacity" values="0;1" dur="0.2s" begin="2.0s" fill="freeze"/>`;
      svg += `<animateMotion dur="2s" begin="2.2s" fill="freeze" path="${d}"/></circle>`;
    }
    
    if (label) {
      svg += `<text x="320" y="260" text-anchor="middle" font-size="14" fill="${C.ink}" opacity="0">${esc(label)}`;
      svg += `<animate attributeName="opacity" values="0;1" dur="0.4s" begin="2.5s" fill="freeze"/></text>`;
    }
    
    svg += `</svg>`;
    return svg;
  }

  /**
   * 原语5：显现序列 (sequence)
   * 用于：5种补语、9种"之"用法、13组关联词
   * 数据：{items: [{title, color, text}], summary}
   */
  function sequence(data) {
    const {items, summary} = data;
    const h = 60 + items.length * 60;
    let svg = `<svg viewBox="0 0 640 ${h}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">`;
    
    items.forEach((item, i) => {
      const y = 40 + i * 60;
      const t = 0.5 + i * 0.7;
      const color = item.color || [C.green, C.blue, C.yellow, C.red][i % 4];
      
      svg += `<g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.3s" begin="${t}s" fill="freeze"/>`;
      svg += `<rect x="20" y="${y-25}" width="600" height="50" rx="8" fill="${color}22" stroke="${color}" stroke-width="1"/>`;
      svg += `<text x="40" y="${y-5}" text-anchor="start" font-size="14" fill="${color}" font-weight="bold">${esc(item.title)}</text>`;
      svg += `<text x="40" y="${y+18}" text-anchor="start" font-size="13" fill="${C.ink}">${esc(item.text)}</text>`;
      svg += `</g>`;
    });
    
    if (summary) {
      const y = 40 + items.length * 60;
      const t = 0.5 + items.length * 0.7;
      svg += `<text x="320" y="${y}" text-anchor="middle" font-size="14" fill="${C.ink}" opacity="0">${esc(summary)}`;
      svg += `<animate attributeName="opacity" values="0;1" dur="0.4s" begin="${t}s" fill="freeze"/></text>`;
    }
    
    svg += `</svg>`;
    return svg;
  }

  // 主入口：编译
  function compile(spec) {
    const {primitive, data} = spec;
    switch (primitive) {
      case 'split': return split(data);
      case 'replace': return replace(data);
      case 'clash': return clash(data);
      case 'path': return path(data);
      case 'sequence': return sequence(data);
      default: throw new Error('Unknown primitive: ' + primitive);
    }
  }

  return {
    compile,
    split,
    replace,
    clash,
    path,
    sequence,
    colors: C
  };
})();

// 浏览器环境导出
if (typeof window !== 'undefined') {
  window.AnimEngine = AnimEngine;
}
// Node 环境导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimEngine;
}
