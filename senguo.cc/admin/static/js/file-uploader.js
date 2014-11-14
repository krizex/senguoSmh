var ZXXFILE = {
    fileInput: null,
    dragDrop: null,
    upButton: null,
    url: "",
    fileFilter: [],
    filter: function(files) {
        return files;
    },
    onSelect: function() {},
    onDelete: function() {},
    onDragOver: function() {},
    onDragLeave: function() {},
    onProgress: function() {},
    onSuccess: function() {},
    onFailure: function() {},
    onComplete: function() {},

    funDragHover: function(e) {
        e.stopPropagation();
        e.preventDefault();
        this[e.type === "dragover"? "onDragOver": "onDragLeave"].call(e.target);
        return this;
    },

    funGetFiles: function(e) {
        this.funDragHover(e);
        var files = e.target.files || e.dataTransfer.files;
        this.fileFilter = this.fileFilter.concat(this.filter(files));
        this.funDealFiles();
        return this;
    },

    funDealFiles: function() {
        for (var i = 0, file; file = this.fileFilter[i]; i++) {
            file.index = i;
        }
        this.onSelect(this.fileFilter);
        return this;
    },


    funDeleteFile: function(fileDelete) {
        var arrFile = [];
        for (var i = 0, file; file = this.fileFilter[i]; i++) {
            if (file != fileDelete) {
                arrFile.push(file);
            } else {
                this.onDelete(fileDelete);
            }
        }
        this.fileFilter = arrFile;
        return this;
    },


    funUploadFile: function() {
        var self = this;
        if (location.host.indexOf("sitepointstatic") >= 0) {

            return;
        }
        for (var i = 0, file; file = this.fileFilter[i]; i++) {
            (function(file) {
                var xhr = new XMLHttpRequest();
                if (xhr.upload) {

                    xhr.upload.addEventListener("progress", function(e) {
                        self.onProgress(file, e.loaded, e.total);
                    }, false);


                    xhr.onreadystatechange = function(e) {
                        if (xhr.readyState == 4) {
                            if (xhr.status == 200) {
                                self.onSuccess(file, xhr.responseText);
                                self.funDeleteFile(file);
                                if (!self.fileFilter.length) {
                                    //鍏ㄩ儴瀹屾瘯
                                    self.onComplete();
                                }
                            } else {
                                self.onFailure(file, xhr.responseText);
                            }
                        }
                    };


                    xhr.open("POST", self.url, true);
                    xhr.setRequestHeader("X_FILENAME", file.name);
                    xhr.send(file);
                }
            })(file);
        }

    },

    init: function() {
        var self = this;
        if (this.dragDrop) {
            this.dragDrop.addEventListener("dragover", function(e) { self.funDragHover(e); }, false);
            this.dragDrop.addEventListener("dragleave", function(e) { self.funDragHover(e); }, false);
            this.dragDrop.addEventListener("drop", function(e) { self.funGetFiles(e); }, false);
        }
        if (this.fileInput) {
            this.fileInput.addEventListener("change", function(e) { self.funGetFiles(e); }, false);
        }
        if (this.upButton) {
            this.upButton.addEventListener("click", function(e) { self.funUploadFile(e); }, false);
        }
    }
};
