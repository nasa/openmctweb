<template>
<span class="form-control shell">
    <span class="field control"
          :class="model.cssClass"
    >
        <input ref="fileInput" id="fileElem" type="file" accept=".json" style="display:none">
        <button id="fileSelect"
            class="c-button"
            @click="selectFile"
        >{{ name }}</button>
    </span>
</span>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            fileInfo: undefined
        };
    },
    computed: {
        name() {
            const fileInfo = this.fileInfo || this.model.value;

            return fileInfo && fileInfo.name || this.model.text;
        }
    },
    mounted() {
        this.$refs.fileInput.addEventListener("change", this.handleFiles, false);
    },
    methods: {
        handleFiles() {
            const fileList = this.$refs.fileInput.files;
            this.readFile(fileList[0]);
        },
        readFile(file) {
            const self = this;
            const fileReader = new FileReader();
            const fileInfo = {};
            fileInfo.name = file.name;
            fileReader.onload = function (event) {
                fileInfo.body = event.target.result;
                self.fileInfo = fileInfo;

                const data = {
                    model: self.model,
                    value: fileInfo
                };
                self.$emit('onChange', data);
            };

            fileReader.onerror = function (error) {
                console.error('fileReader error', error);
            };

            fileReader.readAsText(file);
        },
        selectFile() {
           this.$refs.fileInput.click();
        }
    }
};
</script>
