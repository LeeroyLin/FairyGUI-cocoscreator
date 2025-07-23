import { Color } from "cc";

export function toGrayedColor(c:Color, out:Color): Color {
    let v = c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
    out.set(v, v, v, c.a);
    return out;
}