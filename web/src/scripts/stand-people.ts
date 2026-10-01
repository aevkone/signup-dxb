/**
 * Люди на стенде: плоские фигурки, нарисованные на Canvas 2D.
 * Рост — 100 единиц (1,75 м), начало координат — между ступнями.
 * Лицом к камере — видно лицо; спиной — затылок, причёска или платок.
 * Походка и моргание — чистые функции времени.
 */

export type Look = {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'bun' | 'curly';
  outfit: 'staff' | 'suit' | 'kandura' | 'abaya' | 'dress' | 'casual';
  top: string;
  bottom: string;
  beard?: boolean;
  /** Чуть ниже или выше среднего — толпа не выглядит клонами. */
  height?: number;
};

export const SKIN = ['#f1c9a5', '#d9a47c', '#b07a55', '#7e4f33', '#e9bd98'];
export const HAIR = ['#2b1d16', '#4a3020', '#0f100d', '#8a5a35', '#c9a26b'];

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * Рисует человека. (x, y) — точка ступней на экране, s — пикселей на единицу.
 * front — лицом к камере, walk — фаза шага (0, если стоит), t — время для моргания.
 */
export function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, look: Look, front: boolean, walk: number, t: number, seed: number, alpha = 1) {
  if (s <= 0.02 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  const hs = look.height ?? 1;
  ctx.scale(s, s * hs);

  // Тень на полу
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();

  const swing = Math.sin(walk) * (walk ? 22 : 0);
  const robe = look.outfit === 'kandura' || look.outfit === 'abaya';
  const line = 'rgba(15,16,13,0.55)';
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = line;

  /* Ноги */
  if (!robe) {
    const legTop = look.outfit === 'dress' ? -26 : -46;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 5, legTop);
      ctx.rotate(((side * swing) / 180) * Math.PI);
      ctx.fillStyle = look.outfit === 'dress' ? look.skin : look.bottom;
      rr(ctx, -4.6, 0, 9.2, -legTop - 3, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#16171a';
      ctx.beginPath();
      ctx.ellipse(front ? 1 : -1, -legTop - 2.5, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* Руки — за корпусом */
  const armColor = look.outfit === 'kandura' ? look.top : look.outfit === 'abaya' ? look.top : look.top;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 15.5, -75);
    ctx.rotate(((-side * swing * 0.8 + side * 6) / 180) * Math.PI);
    ctx.fillStyle = armColor;
    rr(ctx, -3.8, 0, 7.6, 31, 3.8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = look.skin;
    ctx.beginPath();
    ctx.arc(0, 32, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* Корпус */
  if (robe) {
    ctx.fillStyle = look.top;
    ctx.beginPath();
    ctx.moveTo(-15, -77);
    ctx.quadraticCurveTo(-17, -40, -18, -2);
    ctx.lineTo(18, -2);
    ctx.quadraticCurveTo(17, -40, 15, -77);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (look.outfit === 'kandura' && front) {
      // Планка и кисточка кандуры
      ctx.strokeStyle = 'rgba(15,16,13,0.18)';
      ctx.beginPath();
      ctx.moveTo(0, -77);
      ctx.lineTo(0, -58);
      ctx.stroke();
      ctx.fillStyle = '#e7e2d3';
      ctx.beginPath();
      ctx.arc(1.5, -56, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = line;
    }
    ctx.fillStyle = '#16171a';
    ctx.beginPath();
    ctx.ellipse(-6, -2, 5, 2.4, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -2, 5, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (look.outfit === 'dress') {
    ctx.fillStyle = look.top;
    ctx.beginPath();
    ctx.moveTo(-14, -77);
    ctx.lineTo(-17, -24);
    ctx.lineTo(17, -24);
    ctx.lineTo(14, -77);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = look.top;
    rr(ctx, -15.5, -78, 31, 36, 7);
    ctx.fill();
    ctx.stroke();
    if (front && (look.outfit === 'staff' || look.outfit === 'suit')) {
      // Рубашка в вырезе пиджака
      ctx.fillStyle = '#f2f2ec';
      ctx.beginPath();
      ctx.moveTo(-5.5, -78);
      ctx.lineTo(0, -64);
      ctx.lineTo(5.5, -78);
      ctx.closePath();
      ctx.fill();
      if (look.outfit === 'suit') {
        ctx.fillStyle = '#59335f';
        ctx.beginPath();
        ctx.moveTo(-1.4, -76);
        ctx.lineTo(1.4, -76);
        ctx.lineTo(1, -66);
        ctx.lineTo(0, -64.5);
        ctx.lineTo(-1, -66);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (front && look.outfit === 'staff') {
      // Бейдж на ленте
      ctx.strokeStyle = '#d2d8a8';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-5, -78);
      ctx.lineTo(4, -63);
      ctx.lineTo(9, -78);
      ctx.stroke();
      ctx.fillStyle = '#d2d8a8';
      rr(ctx, 1, -64, 7, 9, 1.4);
      ctx.fill();
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = line;
    }
  }

  /* Шея и голова */
  ctx.fillStyle = look.skin;
  ctx.fillRect(-3.4, -83, 6.8, 7);
  const HY = -91;
  ctx.beginPath();
  ctx.arc(0, HY, 9.6, 0, Math.PI * 2);
  ctx.fill();

  if (look.outfit === 'kandura') {
    // Гутра: белый платок до плеч, чёрный агаль поверх
    ctx.fillStyle = '#f8f8f4';
    ctx.beginPath();
    if (front) {
      ctx.moveTo(-10.5, HY + 2);
      ctx.quadraticCurveTo(-12, HY - 13, 0, HY - 12.5);
      ctx.quadraticCurveTo(12, HY - 13, 10.5, HY + 2);
      ctx.lineTo(15, -72);
      ctx.lineTo(9, -74);
      ctx.lineTo(8.6, HY - 3);
      ctx.quadraticCurveTo(0, HY - 8, -8.6, HY - 3);
      ctx.lineTo(-9, -74);
      ctx.lineTo(-15, -72);
      ctx.closePath();
    } else {
      ctx.moveTo(-11, HY - 2);
      ctx.quadraticCurveTo(0, HY - 16, 11, HY - 2);
      ctx.lineTo(16, -70);
      ctx.lineTo(-16, -70);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, HY - 8.5, 9.4, 2.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = line;
  } else if (look.outfit === 'abaya') {
    // Шейла: платок вокруг лица
    ctx.fillStyle = look.top;
    ctx.beginPath();
    if (front) {
      ctx.arc(0, HY - 0.5, 12, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(13, -74);
      ctx.lineTo(-13, -74);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = look.skin;
      ctx.beginPath();
      ctx.ellipse(0, HY + 1, 7.4, 8.6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.arc(0, HY - 0.5, 12, 0, Math.PI * 2);
      ctx.moveTo(-13, HY + 4);
      ctx.lineTo(-15, -72);
      ctx.lineTo(15, -72);
      ctx.lineTo(13, HY + 4);
      ctx.fill();
    }
  } else {
    // Причёска
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    if (!front) {
      ctx.arc(0, HY, 10, 0, Math.PI * 2);
      ctx.fill();
      if (look.hairStyle === 'long') {
        rr(ctx, -10.5, HY - 2, 21, 20, 6);
        ctx.fill();
      }
    } else {
      ctx.arc(0, HY - 0.5, 10.2, Math.PI * 1.02, Math.PI * 1.98);
      ctx.quadraticCurveTo(4, HY - 7, -9.5, HY - 2);
      ctx.closePath();
      ctx.fill();
      if (look.hairStyle === 'long') {
        rr(ctx, -11.5, HY - 4, 4.6, 19, 2.3);
        ctx.fill();
        rr(ctx, 6.9, HY - 4, 4.6, 19, 2.3);
        ctx.fill();
      }
    }
    if (look.hairStyle === 'bun') {
      ctx.beginPath();
      ctx.arc(0, HY - 11.5, 4.6, 0, Math.PI * 2);
      ctx.fill();
    }
    if (look.hairStyle === 'curly') {
      for (const [cx, cy] of [
        [-7, HY - 7],
        [0, HY - 10],
        [7, HY - 7],
      ]) {
        ctx.beginPath();
        ctx.arc(cx, cy, 4.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* Лицо */
  if (front) {
    // Моргает раз в несколько секунд, у каждого — своё время
    const blink = ((t + seed * 0.73) % 3.7) < 0.12;
    ctx.fillStyle = '#1b1c1f';
    for (const ex of [-3.4, 3.4]) {
      ctx.beginPath();
      ctx.ellipse(ex, HY + 0.4, 1.25, blink ? 0.25 : 1.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (look.outfit !== 'kandura' && look.outfit !== 'abaya') {
      ctx.strokeStyle = look.hair;
      ctx.lineWidth = 1;
      for (const ex of [-3.4, 3.4]) {
        ctx.beginPath();
        ctx.moveTo(ex - 1.8, HY - 2.6);
        ctx.lineTo(ex + 1.8, HY - 2.9);
        ctx.stroke();
      }
    }
    if (look.beard) {
      ctx.fillStyle = look.hair;
      ctx.beginPath();
      ctx.moveTo(-7.6, HY + 1.5);
      ctx.quadraticCurveTo(0, HY + 14, 7.6, HY + 1.5);
      ctx.quadraticCurveTo(0, HY + 8, -7.6, HY + 1.5);
      ctx.fill();
    }
    // Улыбка и румянец
    // В бороде улыбка — короткая и приглушённая, иначе читается как оскал.
    ctx.strokeStyle = look.beard ? 'rgba(233,217,201,0.7)' : '#7a3b35';
    ctx.lineWidth = look.beard ? 0.8 : 1.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, HY + 3.2, look.beard ? 1.8 : 2.8, Math.PI * 0.25, Math.PI * 0.75);
    ctx.stroke();
    ctx.fillStyle = 'rgba(214,110,110,0.25)';
    ctx.beginPath();
    ctx.arc(-5.6, HY + 3, 1.8, 0, Math.PI * 2);
    ctx.arc(5.6, HY + 3, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
