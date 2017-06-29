(function ($) {
	"use strict";
	$.dropifyGallery = function (el, options) {
		// To avoid scope issues, use 'base' instead of 'this'
		// to reference this class from internal events and functions.
		var base = this;

		// Access to jQuery and DOM versions of element
		base.$el = $(el);
		base.el = el;
		base.dataToDelete = [];

		// Add a reverse reference to the DOM object
		base.$el.data("dropifyGallery", base);

		base.init = function () {

			base.options = $.extend({}, $.dropifyGallery.defaultOptions, options);

			// Put your initialization code here
			if (!base.$el.is("input[type=file]")) {
				console.log("La etiqueta debe ser:  <input type=file>");
			}
			var wrap = $("<div></div>", {
				"class": "drop-area dropify-gallery" + base.options["class"],
				"css": base.options.css
			});
			var thumbs = $("<div></div>", {
				"class": "thumbs " + (!base.options.gallery ? "thumbs-off " : "") + base.options.thumbnails["class"],
				"css": $.extend({}, base.options.thumbnails.css, (!base.options.gallery ? {
					display: "none"
				} : {}))
			});
			var sortable = $("<ul></ul>");
			base.sortable = sortable;
			thumbs.append(sortable);
			base.$el.wrap(wrap);
			base.$el.closest(".drop-area").append(thumbs);
			base.$el.dropify(base.options.dropify).on("dropify.fileReady", function (event, previewable, src) {
				var img = $("<img>", {
					src: src
				});
				img.resizeImage("base64", $.extend({}, {
					center: false
				}, base.options.b64ImgSize));
				img.on("change", function (e) {
					createThumb(0, {
						base64: true,
						src: e.target.src,
						sortValue: 0
					});
					if (base.options.gallery) {
						base.sortable.children().last().prependTo(base.sortable);
						base.sortable.sortable('refresh');
						sortValueFunc(null, {
							item: base.sortable.children().last()
						});
					} else {
						base.sortable.children().filter(":not(:last)").remove();
					}
					sortable.find("li:first").click();
				});
			}).on('dropify.beforeClear', function (event, element) {
				var obj = element.preview.find("img").data("element");
				var src = obj.find("img").data("src");
				var base64 = obj.find("img").data("base64");
				var del = {
					src: src,
					name: src.split("/").pop(),
					sortValue: -1,
					delete: true
				};
				if (!base64) {
					base.dataToDelete.push(del);
				}
				obj.remove();
				if (base.options.gallery) {
					sortable.sortable("refresh");
				}
				base.$el.trigger("imageDeleted", del);
			}).on('dropify.afterClear', function (event, element) {
				if (sortable.find("li:first").length > 0) {
					sortable.find("li:first").click();
					base.$el.parent().addClass("has-preview");
					base.$el.parent().find(".dropify-preview").show();
				}
			});
			if (base.options.imgs) {
				base.options.imgs.sort(function (a, b) {
					return a.sortValue - b.sortValue;
				});
				if (base.options.gallery) {
					$.each(base.options.imgs, createThumb);
				} else {
					createThumb(0, base.options.imgs[0]);
				}
				setTimeout(function () {
					sortable.find('li').eq(0).click();
				}, 100);
				sortable.find('img').on('dragstart', function (event) {
					event.preventDefault();
				});
			}
			if (base.options.gallery) {
				sortable.sortable({
					stop: sortValueFunc
				});
			}
		};

		base.getData = function (filter) {
			var remain = [];
			var news = [];
			base.sortable.sortable('refresh');
			base.$el.closest(".drop-area").find(".thumbs img").each(function (i, elem) {
				if ((filter && $(elem).data(filter)) || !filter) {
					var row = {};
					row.base64 = $(elem).data("base64");
					row.sortValue = $(elem).data("sortValue");
					row.src = $(elem).data("src");
					row.id = $(elem).data("id");
					if (row.base64) {
						news.push(row);
					} else {
						remain.push(row);
					}
				}
			});
			return remain.concat(news).concat(base.dataToDelete);
		};

		function imgClick(event) {
			var dropifyRender = base.$el.parent().find(".dropify-render");
			var image = dropifyRender.find("img");
			var elem = $(event.target).is("img") ? $(event.target) : $(event.target).find("img");
			if (image.length == 0) {
				image = $("<img />", {
					src: elem.data("src"),
					id: "_" + elem.data("id")
				});
				dropifyRender.empty();
				dropifyRender.append(image);
			} else {
				image.attr({
					"src": elem.data("src"),
					"id": "_" + elem.data("id")
				});
			}
			image.data("element", elem.parent());
		}

		function createThumb(i, elem) {
			base.$el.parent().addClass("has-preview");
			var li = $("<li></li>", {
				"class": "thumb-wrap " + base.options.thumb["class"],
				css: base.options.thumb.css
			});
			var classNew = "";
			var id = "img_" + elem.id;
			if (!elem.id) {
				classNew = "new";
				id = "";
			}
			var img = $("<img>", {
				src: elem.src,
				id: id,
				"class": classNew,
				css: {
					width: 0,
					height: 0
				}
			});
			img.data(elem);
			li.append(img);
			base.sortable.append(li);
			img.resizeImage("contain", {
				responsive: false
			});
			li.on('click', imgClick);
			setTimeout(function () {
				base.$el.trigger("imageAdded", elem);
			}, 200);
		}

		function sortValueFunc(event, ui) {
			ui.item.parent().children().each(function (i, elem) {
				elem = $(elem);
				elem.find("img").data("sortValue", elem.index());
			});
		}
		// Run initializer
		base.init();
	};

	$.dropifyGallery.defaultOptions = {
		css: {},
		"class": "",
		thumbnails: {
			css: {},
			"class": ""
		},
		thumb: {
			css: {
				width: 70,
				height: 70
			},
			"class": ""
		},
		gallery: true,
		b64ImgSize: {
			width: 900,
			height: 900
		},
		dropify: {
			css: {},
			"class": "",
			messages: {
				'default': 'Arrastra y suelta o da clic aquí para agregar',
				'replace': 'Arrastra y suelta o da clic aquí para agregar',
				'remove': 'Remover',
				'error': 'Ooops, algo salió mal.'
			},
			error: {
				'fileSize': 'El archivo es demasiado grande (1M max).',
				'minWidth': 'El ancho de la imagen es menor al mínimo solicitado ({{ value }}}px min).',
				'maxWidth': 'El ancho de la imagen es mayor al máximo solicitado ({{ value }}}px max).',
				'minHeight': 'El alto de la imagen es menor al mínimo solicitado ({{ value }}}px min).',
				'maxHeight': 'El alto de la imagen es mayor al máximo solicitado ({{ value }}px max).',
				'imageFormat': 'La imágen no tiene el formato solicitado, ({{ value }} solamente).',
				'fileExtension': 'Este tipo de archivo no está permitido, ({{ value }} solamente).'
			},
			tpl: {
				wrap: '<div class="dropify-wrapper"></div>',
				loader: '<div class="dropify-loader"></div>',
				message: '<div class="dropify-message"><span class="file-icon" /> <p>{{ default }}</p></div>',
				preview: '<div class="dropify-preview"><span class="dropify-render"></span><div class="dropify-infos"><div class="dropify-infos-inner"><p class="dropify-infos-message">{{ replace }}</p></div></div></div>',
				filename: '<p class="dropify-filename"><span class="file-icon"></span> <span class="dropify-filename-inner"></span></p>',
				clearButton: '<button type="button" class="dropify-clear" >{{ remove }}</button>',
				errorLine: '<p class="dropify-error">{{ error }}</p>',
				errorsContainer: '<div class="dropify-errors-container"><ul></ul></div>'
			}
		}
	};

	$.fn.dropifyGallery = function (options) {
		var base = $(this).data("dropifyGallery");
		switch (options) {
			case "getImages":
				return base.getData();
			case "getImagesBase64":
				return base.getData("base64");
			default:
				return this.each(function () {
					if (!base)
						(new $.dropifyGallery(this, options));
				});
		}
	};
})(jQuery);
