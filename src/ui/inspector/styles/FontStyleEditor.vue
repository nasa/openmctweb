<template>
<div class="c-toolbar">
    <div ref="fontSizeMenu"
         class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left"
    >
        <button
            class="c-icon-button c-button--menu icon-font-size"
            @click.prevent.stop="showFontSizeMenu"
        >
            <span class="c-button__label">{{ fontSizeLabel }}</span>
        </button>
    </div>
    <div ref="fontMenu"
         class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left"
    >
        <button
            class="c-icon-button c-button--menu icon-font"
            @click.prevent.stop="showFontMenu"
        >
            <span class="c-button__label">{{ fontTypeLable }}</span>
        </button>
    </div>
</div>
</template>

<script>
import {
    FONT_SIZES,
    FONTS
} from '@/ui/inspector/styles/constants';

export default {
    inject: ['openmct'],
    props: {
        fontStyle: {
            type: Object,
            required: true,
            default: () => {
                return {};
            }
        }
    },
    computed: {
        fontTypeLable() {
            const fontType = FONTS.find(f => f.value === this.fontStyle.font);
            if (!fontType) {
                return '??';
            }

            return fontType.name || fontType.value || FONTS[0].name;
        },
        fontSizeLabel() {
            const fontSize = FONT_SIZES.find(f => f.value === this.fontStyle.fontSize);
            if (!fontSize) {
                return '??';
            }

            return fontSize.name || fontSize.value || FONT_SIZES[0].name;
        },
        fontMenu() {
            return FONTS.map(font => {
                return {
                    cssClass: font.cssClass || '',
                    name: font.name,
                    description: font.name,
                    callBack: () => this.setFont(font.value)
                };
            });
        },
        fontSizeMenu() {
            return FONT_SIZES.map(fontSize => {
                return {
                    cssClass: fontSize.cssClass || '',
                    name: fontSize.name,
                    description: fontSize.name,
                    callBack: () => this.setFontSize(fontSize.value)
                };
            });
        }
    },
    methods: {
        setFont(font) {
            this.$emit('set-font-property', { font });
        },
        setFontSize(fontSize) {
            this.$emit('set-font-property', { fontSize });
        },
        showFontMenu() {
            const elementBoundingClientRect = this.$refs.fontMenu.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.bottom;

            this.openmct.menus.showMenu(x, y, this.fontMenu);
        },
        showFontSizeMenu() {
            const elementBoundingClientRect = this.$refs.fontSizeMenu.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.bottom;

            this.openmct.menus.showMenu(x, y, this.fontSizeMenu);
        }
    }
};
</script>
