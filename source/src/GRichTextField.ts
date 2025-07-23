import { BitmapFont, Color, HorizontalTextAlignment, RichText, SpriteAtlas, SpriteFrame, VerticalTextAlignment } from "cc";
import { PackageItemType, AutoSizeType } from "./FieldTypes";
import { GTextField } from "./GTextField";
import { PackageItem } from "./PackageItem";
import { UIConfig } from "./UIConfig";
import { UIPackage } from "./UIPackage";
import { toGrayedColor } from "./utils/ToolSet";
import { defaultParser } from "./utils/UBBParser";

export class RichTextImageAtlas extends SpriteAtlas {

    public getSpriteFrame(key: string): SpriteFrame {
        let pi: PackageItem = UIPackage.getItemByURL(key);
        if (pi) {
            pi.load();
            if (pi.type == PackageItemType.Image)
                return <SpriteFrame>pi.asset;
            else if (pi.type == PackageItemType.MovieClip)
                return pi.frames[0].texture;
        }

        return super.getSpriteFrame(key);
    }
}

const imageAtlas: RichTextImageAtlas = new RichTextImageAtlas();

export class GRichTextField extends GTextField {
    public _richText: RichText;

    private _bold: boolean;
    private _italics: boolean;
    private _underline: boolean;

    // llx - modified
    private _rfStroke: number;
    // llx - modified
    private _rfStrokeColor: Color;
    // llx - modified
    protected _tempStrokeColor: Color;
    // llx - modified
    protected _tempColor: Color;

    public linkUnderline: boolean;
    public linkColor: string;

    public constructor() {
        super();

        this._node.name = "GRichTextField";
        this._touchDisabled = false;
        this.linkUnderline = UIConfig.linkUnderline;
        
        this._tempColor = new Color(255, 255, 255, 255);
        this._tempStrokeColor = new Color(255, 255, 255, 255);
    }

    protected createRenderer() {
        this._richText = this._node.addComponent(RichText);
        this._richText.handleTouchEvent = false;
        this.autoSize = AutoSizeType.None;
        this._richText.imageAtlas = imageAtlas;
    }

    public get align(): HorizontalTextAlignment {
        return this._richText.horizontalAlign;
    }

    public set align(value: HorizontalTextAlignment) {
        this._richText.horizontalAlign = value;
    }

    public get verticalAlign(): VerticalTextAlignment {
        return this._richText.verticalAlign;
    }

    public set verticalAlign(value: VerticalTextAlignment) {
        this._richText.verticalAlign = value;
    }

    public get underline(): boolean {
        return this._underline;
    }

    public set underline(value: boolean) {
        if (this._underline != value) {
            this._underline = value;

            this.updateText();
        }
    }

    public get bold(): boolean {
        return this._bold;
    }

    public set bold(value: boolean) {
        if (this._bold != value) {
            this._bold = value;

            this.updateText();
        }
    }

    public get italic(): boolean {
        return this._italics;
    }

    public set italic(value: boolean) {
        if (this._italics != value) {
            this._italics = value;

            this.updateText();
        }
    }

    // 描边宽度
    public get stroke(): number {
        return this._rfStroke;
    }

    // 描边宽度
    public set stroke(value: number) {
        this._rfStroke = value;

        this.updateText();
    }

    // 描边颜色
    public get strokeColor(): Color {
        return this._rfStrokeColor;
    }

    // 描边颜色
    public set strokeColor(value: Color) {
        if (!this._rfStrokeColor)
            this._rfStrokeColor = new Color();
        this._rfStrokeColor.set(value);

        this.updateText();
    }

    protected markSizeChanged(): void {
        //RichText貌似没有延迟重建文本，所以这里不需要
    }

    // 处理UUB颜色的置灰情况
    private parseUBBColor(text:string):string {
        return text.replace(/\[color=([^\]]+)\]/g, (match, p1) => {
            this._tempColor.fromHEX(p1);

            toGrayedColor(this._tempColor, this._tempColor);

            return `[color=#${this._tempColor.toHEX("#rrggbb")}]`;
        });
    }

    protected updateText(): void {
        var text2: string = this._text;

        // 空字符串快速处理
        if (!this._text || this._text == "") {
            this._richText.string = text2;
            return;
        }

        if (this._templateVars)
            text2 = this.parseTemplate(text2);

        if (this._ubbEnabled) {
            defaultParser.linkUnderline = this.linkUnderline;
            defaultParser.linkColor = this.linkColor;

            // 先处理UUB颜色的置灰情况，再格式化ubb
            text2 = defaultParser.parse(this.parseUBBColor(text2));
        }

        if (this._bold)
            text2 = "<b>" + text2 + "</b>";
        if (this._italics)
            text2 = "<i>" + text2 + "</i>";
        if (this._underline)
            text2 = "<u>" + text2 + "</u>";
        let c = this._color
        if (this._grayed)
            toGrayedColor(c, c);
        text2 = "<color=" + c.toHEX("#rrggbb") + ">" + text2 + "</color>";

        // 有描边
        if (this.stroke) {
            let strokeC = this._tempColor;
            strokeC.set(this.strokeColor);

            // 置灰
            if (this._grayed)
                toGrayedColor(strokeC, strokeC);

            text2 = `<outline color=#${strokeC.toHEX("#rrggbb")} width=${this.stroke}>${text2}</outline>`;
        }

        if (this._autoSize == AutoSizeType.Both) {
            if (this._richText.maxWidth != 0)
                this._richText["_maxWidth"] = 0;
            this._richText.string = text2;
            if (this.maxWidth != 0 && this._uiTrans.contentSize.width > this.maxWidth)
                this._richText.maxWidth = this.maxWidth;
        }
        else
            this._richText.string = text2;
    }

    protected updateFont() {
        this.assignFont(this._richText, this._realFont);
    }

    protected updateFontColor() {
        this.assignFontColor(this._richText, this._color);
    }

    protected updateFontSize() {
        let fontSize: number = this._fontSize;
        let font: any = this._richText.font;
        if (font instanceof BitmapFont) {
            if (!font.fntConfig.resizable)
                fontSize = font.fntConfig.fontSize;
        }

        this._richText.fontSize = fontSize;
        this._richText.lineHeight = fontSize + this._leading * 2;
    }

    protected updateOverflow() {
        if (this._autoSize == AutoSizeType.Both)
            this._richText.maxWidth = 0;
        else
            this._richText.maxWidth = this._width;
    }

    protected handleSizeChanged(): void {
        if (this._updatingSize)
            return;

        if (this._autoSize != AutoSizeType.Both)
            this._richText.maxWidth = this._width;
    }

    // 置灰回调
    protected handleGrayedChanged(): void {
        this.updateFontColor();
        this.updateText();
    }
}