import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { loadModules } from 'esri-loader';
import esri = __esri; // Esri TypeScript Types
import * as vars from './variables';
import { Http } from '@angular/http';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-esrimap',
  templateUrl: './esrimap.component.html',
  styleUrls: ['./esrimap.component.css']
})
export class EsrimapComponent implements OnInit {
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;
  private _zoom = 15;
  private _center: Array<number> = [-95.118420276135581, 31.072854453305986];
  private _basemap = 'hybrid';
  mapView: __esri.MapView;
  lineGraphic: __esri.Graphic;
  ptGraphic: __esri.Graphic;
  totalPaths = vars.line1.length;
  public createGraphic;
  public createLabels;
  public countPointsPerLine;
  public createPolyline;
  public that;
  public lastBearing = 90;
  delay = 100; // milli seconds delay
  legNumber = 1; // first leg
  legHop = 0;
  distanceLat = 0.005; // 0.0005
  allPtGraphics = [];
  allPtArray = [];
  public setTimeOutAnimation;
  _polyline: __esri.Polyline;
  ptLayer: __esri.GraphicsLayer;
  lineLayer: __esri.GraphicsLayer;
  labelsLayer: __esri.GraphicsLayer;
  @Input() masterId;
  map: __esri.Map;
  constructor(private http: Http) { }

  animateRoute = () => {
    console.log(this.lineGraphic);
  }

  public addLabel(legNumber, c) {
    const newLabel = this.createLabels('Stop number: ' + legNumber + 1, c.geometry);
     this.labelsLayer.add(newLabel);
     this.labelsLayer.add(this.createGraphic(vars.stopSymbol, c.geometry));
  }

  public getTotalHopsMaster(id) {
    const count = this.countPointsPerLine(vars.line1[id], 50);
    return count;
  }

  public getTotalHops(id) {
    // return 200;
    // const count = countPointsPerLine(vars.line1[id ], 1000);
    // return count;
    return this.allPtArray[id].length;
  }

  public requestData() {
    // tslint:disable-next-line:max-line-length
    this.http.get('http://tfsgis-dfe02.tfs.tamu.edu/arcgis/rest/services/TxScenicViews/ScenicLocations/FeatureServer/3/query?where=masterId+%3D+' + this.masterId + '&f=geojson&returnGeometry=true')
    .pipe(map(response => response.json())).subscribe(d => {
      console.log(d.features[0].geometry.coordinates);
      console.log(d.features[0].geometry.coordinates.flat());
      const _pathArray = [];
      d.features.forEach(_f => {
        _pathArray.push(_f.geometry.coordinates);
      });
      this._polyline.paths = _pathArray;
      this.prepareForAnimation(this._polyline);
    });
  }

  public prepareForAnimation(polyline) {

    // loop for the all paths inside that polyline
    for (let pthId = 0; pthId < polyline.paths.length; pthId++) {
      // get total hops per individual path sections
      const countPerleg = this.getTotalHopsMaster(pthId);
      // console.log(countPerleg);
      // now get all those points
      const ptArraySection = [];
      const ptGraphicsArraySection = [];
      // add first point
      const ptGraphic1 = this.createGraphic(vars.markerSymbol,
        {
          type: 'point',
          longitude: polyline.paths[pthId][0][0],
          latitude: polyline.paths[pthId][0][1],
          spatialReference: this.mapView.spatialReference
        });

      ptGraphicsArraySection.push(ptGraphic1);
      ptArraySection.push([polyline.paths[pthId][0][0], polyline.paths[pthId][0][1]]);

      for (let hop = 0; hop <= countPerleg; hop++) {
        const c = vars.getPointAlongLine(polyline, (hop + 1) * this.distanceLat, pthId);
        if (c !== null) {
          this.ptGraphic = this.createGraphic(vars.markerSymbol,
            {
              type: 'point',
              longitude: c[0],
              latitude: c[1],
              spatialReference: this.mapView.spatialReference
            });
          ptGraphicsArraySection.push(this.ptGraphic);
          ptArraySection.push([c[0], c[1]]);
        } else {
          hop = countPerleg + 5;
        }
      }
      // also add the ending point
      const _totalPt = polyline.paths[pthId].length;
      const ptGraphic2 = this.createGraphic(vars.markerSymbol,
        {
          type: 'point',
          longitude: polyline.paths[pthId][_totalPt - 1][0],
          latitude: polyline.paths[pthId][_totalPt - 1][1],
          spatialReference: this.mapView.spatialReference
        });

      ptGraphicsArraySection.push(ptGraphic2);
      ptArraySection.push([polyline.paths[pthId][_totalPt - 1][0], polyline.paths[pthId][_totalPt - 1][1]]);
      this.allPtArray.push(ptArraySection);
      this.allPtGraphics.push(ptGraphicsArraySection);
    }
    this.addLabel(this.legNumber - 1, this.allPtGraphics[this.legNumber - 1][this.legHop]);
    console.log(this.allPtArray);
    console.log(polyline.extent);
    const e = polyline.extent.clone();
    this.mapView.extent = e.expand(1.5);
    this.animateAll();
  }

  public animateAll() {
    this.legHop = this.legHop + 1;
    let newpaths;
    if (this.legHop === 0) {
      newpaths = [this.allPtArray[this.legNumber - 1].slice(this.legHop, this.legHop + 1)];
    } else if (this.legHop >= this.getTotalHops(this.legNumber - 1)) {
      newpaths = [this.allPtArray[this.legNumber - 1].slice(this.legHop - 1, this.legHop)];
    } else {
      newpaths = [this.allPtArray[this.legNumber - 1].slice(this.legHop - 1, this.legHop + 1)];
    }
    this.ptLayer.removeAll();
    const line1 = this.createPolyline(newpaths, 4326);
    const _graphic = this.allPtGraphics[this.legNumber - 1][this.legHop - 1];
    this.lastBearing = (vars.bearing(newpaths) === -9999) ? vars.bearing(newpaths) : this.lastBearing;
    _graphic.symbol.angle = vars.bearing(newpaths);
    const lineGraphic1 = this.createGraphic(vars.highLightedLineSymbol, line1);
    this.lineLayer.add(lineGraphic1);

      this.ptLayer.add(_graphic);
    /* animation logic */
    if (this.legNumber < this.totalPaths) {
      if (this.legHop > (this.getTotalHops(this.legNumber - 1) - 1) && this.legNumber <= this.totalPaths) {
        this.addLabel(this.legNumber, this.allPtGraphics[this.legNumber - 1][this.legHop - 1]);
        this.legNumber++;
        this.legHop = 0;
        this.setTimeOutAnimation = setTimeout(() => { this.animateAll(); }, this.delay);
      } else if (this.legHop >= this.getTotalHops(this.legNumber - 1) && this.legNumber > this.totalPaths) {
        return;
      } else {
        // tslint:disable-next-line:max-line-length
        this.setTimeOutAnimation = setTimeout(() => {  this.animateAll(); }, (this.legHop === 1 && this.legNumber === 1 ) ? 200 : this.delay);
      }
    } else if (this.legHop < this.getTotalHops(this.legNumber - 1)) {
      this.setTimeOutAnimation = setTimeout(() => { this.animateAll(); }, this.delay);
    } else {
      // this.ptLayer.removeAll();
      this.addLabel(this.legNumber, this.allPtGraphics[this.legNumber - 1][this.legHop - 1]);
      console.log('finally done');
    }
  }

  async initializeMap() {

    const [EsriMap, EsriMapView, GraphicsLayer, Graphic, TextSymbol, Polyline, Point, geometryEngine] = await loadModules([
      'esri/Map', 'esri/views/MapView', 'esri/layers/GraphicsLayer', 'esri/Graphic', 'esri/symbols/TextSymbol',
      'esri/geometry/Polyline', 'esri/geometry/Point', 'esri/geometry/geometryEngine',
      'dojo/domReady'
    ]);

    this.map = new EsriMap({ basemap: this._basemap });
    // Initialize the MapView
    const mapViewProperties: esri.MapViewProperties = {
      container: this.mapViewEl.nativeElement,
      center: this._center,
      zoom: this._zoom,
      map: this.map
    };

    this.mapView = new EsriMapView(mapViewProperties);
    const line = new Polyline({
      paths: vars.line1,
      spatialReference: { wkid: 4326 }
    });

    this.lineGraphic = new Graphic({
      geometry: line,
      symbol: vars.lineGraphicSymbol
    });

    this.createGraphic = (s, g) => {
      return new Graphic({ geometry: g, symbol: s });
    };

    this.createPolyline = (_paths, _wkid) => {
      return new Polyline({
        paths: _paths,
        spatialReference: { wkid: _wkid }
      });
    };

    this.countPointsPerLine = (polylinePath, distance) => {
      const pl = new Polyline({
        paths: polylinePath,
        spatialReference: { wkid: 4326 }
      });
      return Math.round(geometryEngine.geodesicLength(pl, 'meters') / distance);
    };

    this.ptGraphic = new Graphic({ geometry: null, symbol: null });
    this.lineLayer = new GraphicsLayer();
    this.ptLayer = new GraphicsLayer();
    this.labelsLayer = new GraphicsLayer();
    this.lineLayer.add(this.lineGraphic);
    this.map.addMany([this.ptLayer, this.lineLayer, this.labelsLayer]);

    this._polyline = new Polyline({
      paths: vars.line1,
      spatialReference: { wkid: 4326 }
    });


    this.createLabels = (label, geometry) => {
      const _lblSymbol = vars.labelSymbol;
      _lblSymbol.text = label;
      return this.createGraphic(_lblSymbol, geometry);
    };
    return this.mapView;
  }

  ngOnInit() {
    this.initializeMap();
  }
  public stopAnimation() {
    clearTimeout(this.setTimeOutAnimation);
  }

}
