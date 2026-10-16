import qs from 'query-string';
import { omit, isArray } from 'lodash-es';
import axios from 'axios';
import { GenerateLayerByGeoJson } from '@/utils/MapCommonMethods';
import {
	FeatureLayer,
	ImageryLayer,
	TileLayer,
	SceneLayer,
	MapImageLayer,
	VectorTileLayer,
	GraphicsLayer,
	WMSLayer,
	WMTSLayer,
	BaseTileLayer,
	esriRequest,
	Extent,
	Point,
	SpatialReference,
	TileInfo,
	WebTileLayer
} from '../modules';
import CustomTileLayer from './CustomTileLayer';
import { MapTypeEnum } from '../index.types';

function XmlToJson(xmlStr) {
	const parser = new DOMParser();
	const xmlDoc = parser.parseFromString(xmlStr, "text/xml");

	function convert(node) {
		let obj = {};
		if (node.nodeType === 1) {
			if (node.attributes && node.attributes.length > 0) {
				obj["@attributes"] = {};
				for (let j = 0; j < node.attributes.length; j++) {
					const attribute = node.attributes.item(j);
					obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
				}
			}
			if (node.hasChildNodes()) {
				const childNodes = node.childNodes;
				if (childNodes.length === 1 && childNodes[0].nodeType === 3) {
					obj["#text"] = childNodes[0].nodeValue;
				} else {
					for (let i = 0; i < childNodes.length; i++) {
						const child = childNodes[i];
						if (child.nodeType === 1) {
							const childObj = convert(child);
							const childName = child.nodeName;
							if (obj[childName]) {
								if (!(obj[childName] instanceof Array)) {
									obj[childName] = [obj[childName]];
								}
								obj[childName].push(childObj);
							} else {
								obj[childName] = childObj;
							}
						}
					}
				}
			}
		} else if (node.nodeType === 3) {
			obj = node.nodeValue;
		}
		return obj;
	}

	return convert(xmlDoc.documentElement);
}

const CustomTileInfo = new TileInfo({
	dpi: 96,
	rows: 256,
	cols: 256,
	compressionQuality: 0,
	origin: {
		x: -180,
		y: 90,
	},
	spatialReference: {
		wkid: 4490,
	},
	lods: [
		{
			"level": 0,
			"resolution": 0.7031250131157901,
			"scale": 295497598.5708346
		},
		{
			"level": 1,
			"resolution": 0.35156250655789506,
			"scale": 147748799.2854173
		},
		{
			"level": 2,
			"resolution": 0.17578125327894753,
			"scale": 73874399.64270864
		},
		{
			"level": 3,
			"resolution": 0.08789062663947377,
			"scale": 36937199.82135432
		},
		{
			"level": 4,
			"resolution": 0.04394531331973688,
			"scale": 18468599.91067716
		},
		{
			"level": 5,
			"resolution": 0.02197265665986844,
			"scale": 9234299.95533858
		},
		{
			"level": 6,
			"resolution": 0.010986328329934222,
			"scale": 4617149.97766929
		},
		{
			"level": 7,
			"resolution": 0.005493164164967111,
			"scale": 2308574.988834645
		},
		{
			"level": 8,
			"resolution": 0.0027465820824835543,
			"scale": 1154287.494417322
		},
		{
			"level": 9,
			"resolution": 0.0013732910412417778,
			"scale": 577143.7472086613
		},
		{
			"level": 10,
			"resolution": 0.0006866455206208889,
			"scale": 288571.87360433064
		},
		{
			"level": 11,
			"resolution": 0.00034332276031044445,
			"scale": 144285.93680216532
		},
		{
			"level": 12,
			"resolution": 0.00017166138015522222,
			"scale": 72142.96840108266
		},
		{
			"level": 13,
			"resolution": 0.00008583069007761111,
			"scale": 36071.48420054133
		},
		{
			"level": 14,
			"resolution": 0.000042915345038805556,
			"scale": 18035.742100270665
		},
		{
			"level": 15,
			"resolution": 0.000021457672519402778,
			"scale": 9017.871050135333
		},
		{
			"level": 16,
			"resolution": 0.000010728836259701389,
			"scale": 4508.935525067666
		},
		{
			"level": 17,
			"resolution": 0.0000053644181298506945,
			"scale": 2254.467762533833
		},
	],
});

class MapLayer {
	constructor(props) {
		const { Map, MapView } = props;
		this.Map = Map;
		this.MapView = MapView;
	}

	addGeoJsonLayer(geoJson, otherProps) {
		return GenerateLayerByGeoJson(geoJson, otherProps?.map, otherProps?.initRenderer, otherProps?.showArea, otherProps?.areaText, otherProps?.isAnalysisDetail)?.generateLayer
	}

	addImageryLayer(url, otherProps) {
		return new ImageryLayer({ url, ...otherProps })
	}

	addTileLayer(url, otherProps) {
		return new TileLayer({ url, ...otherProps })
	}

	addCustomTileLayer(url, otherProps) {
		return CustomTileLayer({ url, ...otherProps })
	}

	addFeatureLayer(url, otherProps) {
		let layer;
		if (otherProps?.isGraphic && otherProps?.source && !url) {
			layer = new FeatureLayer({
				...otherProps,
				objectIdField: "objectid",
				source: otherProps.source,
			})
		} else {
			layer = new FeatureLayer({ url, ...otherProps })
		}
		if (layer.url === url) layer.layerId = null
		return layer
	}

	addVectorTileLayer(url, otherProps) {
		return new VectorTileLayer({ url, ...otherProps })
	}

	addSceneLayer(url, otherProps) {
		return new SceneLayer({ url, ...otherProps })
	}

	addMapImageLayer(url, otherProps) {
		return new MapImageLayer({ url, ...otherProps })
	}

	addGraphicsLayer(props) {
		return new GraphicsLayer({ ...props });
	}

	addWMSLayer(url, otherProps) {
		return new WMSLayer({ url, ...otherProps })
	}

	addWMTSLayer(url, otherProps) {
		return new WMTSLayer({ url, ...otherProps })
	}

	async addSuperMapTileWMSLayer(props) {
		const { url, otherProps } = props;
		const { MapView } = this;
		let layerResult;
		let resolution;
		let envelope;
		let zoom = 0;
		let scales;

		layerResult = await esriRequest(`${url}.json`);
		const { data } = layerResult;
		const originResult = data;
		if (originResult.prjCoordSys) {
			if (originResult.prjCoordSys.coordUnit) {
				resolution = scaleToResolution(originResult.scale, 96, originResult.prjCoordSys.coordUnit);
			}

			if (!envelope) {
				envelope = originResult.bounds;
			}
			scales = getScales(envelope, originResult.prjCoordSys.coordUnit);
			if (originResult.scale) {
				let temp;
				for (let j = 0; j < scales.length; j++) {
					if (j === 0) {
						temp = Math.abs(originResult.scale - scales[j]);
					}
					if (temp > Math.abs(originResult.scale - scales[j])) {
						temp = Math.abs(originResult.scale - scales[j]);
						zoom = j;
					}
				}
			}
		}

		function getMeterPerMapUnit(mapUnit) {
			const earchRadiusInMeters = 6378137;
			let meterPerMapUnit = 0;
			if (mapUnit === 'METER') {
				meterPerMapUnit = 1;
			} else if (mapUnit === 'DEGREE') {
				meterPerMapUnit = Math.PI * 2 * earchRadiusInMeters / 360;
			} else if (mapUnit === 'KILOMETER') {
				meterPerMapUnit = 1.0E-3;
			} else if (mapUnit === 'INCH') {
				meterPerMapUnit = 1 / 2.5399999918E-2;
			} else if (mapUnit === 'FOOT') {
				meterPerMapUnit = 0.3048;
			}
			return meterPerMapUnit;
		}

		function resolutionToScale(resolu, dpi, mapUnit) {
			const originLods = TileInfo.create({
				spatialReference: new SpatialReference({
					wkid: otherProps?.spatialReference?.wkid || MapView?.spatialReference?.wkid || 4490,
				})
			}).lods;
			const inchPerMeter = 1 / 0.0254;
			const meterPerMapUnit = getMeterPerMapUnit(mapUnit);
			let scale = resolu * dpi * inchPerMeter * meterPerMapUnit;
			scale = 1 / scale * (scale / originLods[0].scale);
			return scale;
		}

		function getScales(bounds, coordUnit) {
			const resolution0 = Math.abs(bounds.left - bounds.right) / 256;
			let temp = resolutionToScale(resolution0, 96, coordUnit);
			const scaleArr = [];
			for (let i = 0; i < 24; i += 1) {
				if (i === 0) {
					scaleArr[i] = temp;
				} else {
					temp *= 2;
					scaleArr[i] = temp;
				}
			}
			return scaleArr;
		}

		function scaleToResolution(scale, dpi, mapUnit) {
			const inchPerMeter = 1 / 0.0254;
			const meterPerMapUnitValue = getMeterPerMapUnit(mapUnit);
			let resolution = scale * dpi * inchPerMeter * meterPerMapUnitValue;
			resolution = 1 / resolution;
			return resolution;
		}

		const TileWMSLayer = BaseTileLayer.createSubclass({
			properties: {
				urlTemplate: null,
				fullExtent: null,
				tileInfo: null,
				spatialReference: null,
				title: null
			},
			getTileUrl(level, row, col) {
				return this.urlTemplate
					.replace("%7Bx%7D", col)
					.replace("%7By%7D", row)
					.replace("%7Bscale%7D", scales[level]);
			},
			fetchTile(level, row, col, options) {
				const url = this.getTileUrl(level, row, col);
				return esriRequest(url, {
					responseType: "image",
					signal: options && options.signal
				}).then(
					function (response) {
						const image = response.data;
						const width = this.tileInfo.size[0];
						const height = this.tileInfo.size[0];
						const canvas = document.createElement("canvas");
						const context = canvas.getContext("2d");
						canvas.width = width;
						canvas.height = height;
						context.drawImage(image, 0, 0, width, height);
						return canvas;
					}.bind(this)
				);
			}
		})

		const params = {
			redirect: false,
			transparent: true,
			cacheEnabled: true,
			overlapDisplayed: false,
			width: 256,
			height: 256,
			origin: JSON.stringify({ x: envelope.left, y: envelope.top }),
			x: '{x}',
			y: '{y}',
			scale: '{scale}'
		}
		const spatialReference = new SpatialReference({
			wkid: otherProps?.spatialReference?.wkid || MapView?.spatialReference?.wkid || 4490,
		})

		return new TileWMSLayer({
			urlTemplate: `${url}/tileImage.png?${qs.stringify(params)}`,
			fullExtent: new Extent({
				xmin: envelope.left,
				ymin: envelope.bottom,
				xmax: envelope.right,
				ymax: envelope.top,
				spatialReference
			}),
			tileInfo: TileInfo.create({
				spatialReference,
				origin: new Point({
					x: envelope.left,
					y: envelope.top,
					spatialReference
				}),
			}),
			spatialReference,
			...omit(otherProps, ['spatialReference'])
		});
	}

	async addTianDiTuLayer(url, otherProps) {
		if (!url) {
			return;
		}
		const { MapView } = this;
		const GetAxiosResponse = (url) => {
			return new Promise(async (resolve) => {
				const newUrl =
					url.indexOf("?request=GetCapabilities&service=wmts") === -1
						? `${url}?request=GetCapabilities&service=wmts`
						: url;
				const response = await axios(newUrl);
				resolve(response);
			});
		};
		let response = await GetAxiosResponse(url);
		const urlXmlDataContent = XmlToJson(response?.data);
		const {
			Layer,
			Layer: { Style, TileMatrixSet },
		} = urlXmlDataContent?.Contents;
		let layerStyle = Layer?.["ows:Identifier"]?.['#text'];
		let layerTileMatrixSet = "c";

		if (TileMatrixSet && !isArray(TileMatrixSet)) {
			layerTileMatrixSet = TileMatrixSet?.["ows:Identifier"];
		} else if (TileMatrixSet && isArray(TileMatrixSet)) {
			const isDefaultTileMatrixSet = TileMatrixSet?.filter(
				(t) => t?.attr?.["@_isDefault"]
			)?.[0];
			if (isDefaultTileMatrixSet) {
				layerTileMatrixSet = isDefaultTileMatrixSet?.["ows:Identifier"];
			}
		}
		const mapTk = otherProps?.tk || '6c83c909c8681528de2b5457acfa3c39';
		const TianDiLayer = BaseTileLayer.createSubclass({
			properties: {
				urlTemplate: null,
			},
			load: function () {
				this.tileInfo = {
					rows: 256,
					cols: 256,
					dpi: 96,
					format: "LERC",
					compressionQuality: 0,
					lercError: 0.1,
					origin: {
						x: -180,
						y: 90,
					},
					spatialReference: {
						wkid: 4490,
						latestWkid: 4490,
					},
					lods: [
						{
							level: 0,
							resolution: 0.7031250131157905,
							scale: 2.954975985708346e8,
						},
						{
							level: 1,
							resolution: 0.3515625065578952,
							scale: 1.477487992854173e8,
						},
						{
							level: 2,
							resolution: 0.1757812532789476,
							scale: 7.387439964270864e7,
						},
						{
							level: 3,
							resolution: 0.0878906266394738,
							scale: 3.693719982135432e7,
						},
						{
							level: 4,
							resolution: 0.0439453133197369,
							scale: 1.846859991067716e7,
						},
						{
							level: 5,
							resolution: 0.02197265665986845,
							scale: 9234299.95533858,
						},
						{
							level: 6,
							resolution: 0.010986328329934226,
							scale: 4617149.97766929,
						},
						{
							level: 7,
							resolution: 0.005493164164967113,
							scale: 2308574.988834645,
						},
						{
							level: 8,
							resolution: 0.002746582082483555,
							scale: 1154287.494417322,
						},
						{
							level: 9,
							resolution: 0.0013732910412417782,
							scale: 577143.7472086613,
						},
						{
							level: 10,
							resolution: 6.866455206208891e-4,
							scale: 288571.87360433064,
						},
						{
							level: 11,
							resolution: 3.4332276031044456e-4,
							scale: 144285.93680216532,
						},
						{
							level: 12,
							resolution: 1.7166138015522228e-4,
							scale: 72142.96840108266,
						},
						{
							level: 13,
							resolution: 8.583069007761114e-5,
							scale: 36071.48420054133,
						},
						{
							level: 14,
							resolution: 4.291534503880557e-5,
							scale: 18035.742100270665,
						},
						{
							level: 15,
							resolution: 2.1457672519402785e-5,
							scale: 9017.871050135333,
						},
						{
							level: 16,
							resolution: 1.0728836259701392e-5,
							scale: 4508.935525067666,
						},
						{
							level: 17,
							resolution: 5.364418129850696e-6,
							scale: 2254.467762533833,
						},
					],
				};
			},
			getTileUrl: function (z, y, x) {
				const url = `${this.url
					}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layerStyle}&STYLE=default&TILEMATRIXSET=${layerTileMatrixSet}&FORMAT=tiles&TILECOL=${x}&TILEROW=${y}&TILEMATRIX=${z + 1
					}&tk=${mapTk}`;

				return url;
			},
		});

		const spatialReference = new SpatialReference({
			wkid:
				otherProps?.spatialReference?.wkid ||
				MapView?.spatialReference?.wkid ||
				4490,
		});
		return new TianDiLayer({
			url,
			urlTemplate: `${url}`,
			tileInfo: TileInfo.create({
				spatialReference,
			}),
			spatialReference,
			...omit(otherProps, ["spatialReference"]),
		});
	}

	addWebTileLayer(url, otherProps) {
		const { MapView } = this;
		const spatialReference = new SpatialReference({
			wkid: otherProps?.spatialReference?.wkid || MapView?.spatialReference?.wkid || 4490,
		})

		const tileInfo = new TileInfo({
			dpi: 96,
			rows: 256,
			cols: 256,
			compressionQuality: 0,
			origin: {
				x: -180,
				y: 90
			},
			spatialReference,
			lods: [{
				"level": 0,
				"resolution": 1.40625002623158,
				"scale": 590995197.14166903
			},
			{
				"level": 1,
				"resolution": 0.70312501311579023,
				"scale": 295497598.57083458
			},
			{
				"level": 2,
				"resolution": 0.35156250655789512,
				"scale": 147748799.28541729
			},
			{
				"level": 3,
				"resolution": 0.17578125327894756,
				"scale": 73874399.642708644
			},
			{
				"level": 4,
				"resolution": 0.087890626639473779,
				"scale": 36937199.821354322
			},
			{
				"level": 5,
				"resolution": 0.043945313319736889,
				"scale": 18468599.910677161
			},
			{
				"level": 6,
				"resolution": 0.021972656659868445,
				"scale": 9234299.9553385805
			},
			{
				"level": 7,
				"resolution": 0.010986328329934222,
				"scale": 4617149.9776692903
			},
			{
				"level": 8,
				"resolution": 0.0054931641649671112,
				"scale": 2308574.9888346451
			},
			{
				"level": 9,
				"resolution": 0.0027465820824835543,
				"scale": 1154287.4944173221
			},
			{
				"level": 10,
				"resolution": 0.0013732910412417778,
				"scale": 577143.74720866128
			},
			{
				"level": 11,
				"resolution": 0.0006866455206208889,
				"scale": 288571.87360433064
			},
			{
				"level": 12,
				"resolution": 0.00034332276031044445,
				"scale": 144285.93680216532
			},
			{
				"level": 13,
				"resolution": 0.00017166138015522222,
				"scale": 72142.96840108266
			},
			{
				"level": 14,
				"resolution": 8.5830690077611112e-05,
				"scale": 36071.48420054133
			},
			{
				"level": 15,
				"resolution": 4.2915345038805556e-05,
				"scale": 18035.742100270665
			},
			{
				"level": 16,
				"resolution": 2.1457672519402778e-05,
				"scale": 9017.8710501353326
			},
			{
				"level": 17,
				"resolution": 1.0728836259701389e-05,
				"scale": 4508.9355250676663
			},
			{
				"level": 18,
				"resolution": 5.3644181298506945e-06,
				"scale": 2254.4677625338331
			},
			{
				"level": 19,
				"resolution": 2.6822090649253481e-06,
				"scale": 1127.233881266917
			},
			{
				"level": 20,
				"resolution": 1.3411045324626741e-06,
				"scale": 563.61694063345851
			}
			]
		});

		return new WebTileLayer({
			title: "wmts测试",
			urlTemplate: url,
			tileInfo,
			spatialReference,
			fullExtent: {
				spatialReference,
				xmax: 106.26069501042377,
				xmin: 97.48001977801334,
				ymax: 29.25097122788427,
				ymin: 21.07835143804548
			}
		})
	}

	async loadMap(props) {
		const { type, url, otherProps } = props;
		if (!type || (!url && !otherProps)) return null;
		let layer;
		switch (type) {
			case MapTypeEnum.GeoJsonLayer:
				if (!props?.geoJson) return null;
				layer = this.addGeoJsonLayer(props?.geoJson, otherProps);
				break;
			case MapTypeEnum.ImageryLayer:
				layer = this.addImageryLayer(url, otherProps);
				break;
			case MapTypeEnum.TileLayer:
			case MapTypeEnum.GoTileLayer:
				layer = this.addTileLayer(url, otherProps);
				break;
			case MapTypeEnum.CustomTileLayer:
				layer = this.addCustomTileLayer(url, otherProps);
				break;
			case MapTypeEnum.FeatureLayer:
				layer = this.addFeatureLayer(url, otherProps);
				break;
			case MapTypeEnum.VectorTileLayer:
				layer = this.addVectorTileLayer(url, otherProps);
				break;
			case MapTypeEnum.YJDVectorTileLayer:
				layer = this.addVectorTileLayer(url, otherProps);
				break;
			case MapTypeEnum.SceneLayer:
				layer = this.addSceneLayer(url, otherProps);
				break;
			case MapTypeEnum.MapImageLayer:
				layer = this.addMapImageLayer(url, otherProps);
				break;
			case MapTypeEnum.GraphicsLayer:
				layer = this.addGraphicsLayer(otherProps);
				break;
			case MapTypeEnum.WMSLayer:
				layer = this.addWMSLayer(url, otherProps);
				break;
			case MapTypeEnum.WMTSLayer:
				layer = this.addWMTSLayer(url, otherProps);
				break;
			case MapTypeEnum.SuperMapTileWMS:
				if (url) layer = await this.addSuperMapTileWMSLayer({ url, otherProps });
				break;
			case MapTypeEnum.TianDituLayer:
				if (url) layer = await this.addTianDiTuLayer(url, otherProps);
				break;
			case MapTypeEnum.WebTileLayer:
				if (url) layer = await this.addWebTileLayer(url, otherProps);
				if (layer) layer.set({ serverId: otherProps?.serverId, featureId: otherProps?.featureId })
				break;
			default:
				break;
		}
		return layer;
	}

	async addLayerToMap(props, index) {
		let layer = await this.loadMap(props);
		if (props?.groupType && layer) {
			layer.set({
				groupType: props.groupType,
				serverId: props?.otherProps?.serverId || '',
				hasData: props?.otherProps?.hasData,
				isYJDVectorTileLayer: props?.type && ['YJDVectorTileLayer', 'GoTileLayer'].includes(props?.type),
				featureCode: props?.otherProps?.featureCode,
				isGeoJson: props?.geoJson,
				useCode: props?.otherProps?.useCode
			})
		}
		if (layer) this.Map.add(layer, index);
		return layer;
	}
}

export const useMapLayer = (props) => {
	return new MapLayer(props);
}

export default useMapLayer;
