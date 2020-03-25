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
  public mapView: __esri.MapView;
  public lineGraphic: __esri.Graphic;
  public ptGraphic: __esri.Graphic;
  public createGraphic;
  public createLabels;
  public countPointsPerLine;
  public createPolyline;
  public lastBearing = 90;
  private delay = 20; // milli seconds delay
  private legNumber = 1; // first leg
  private legHop = 0;
  private distanceLat = 0.005; // 0.0005
  private allPtGraphics = [];
  private allPtArray = [];
  private totalPaths = this.allPtArray.length;
  public setTimeOutAnimation;
  public routeLine: __esri.Polyline;
  public lineLayer: __esri.GraphicsLayer;
  public labelsLayer: __esri.GraphicsLayer;
  public map: __esri.Map;
  public isReplayVisible = false;
  @Output() closed = new EventEmitter<boolean>();
  @Input() masterId;

  constructor(private http: Http) { }

  public closedAnimation() {
    this.closed.emit(true);
  }

  public addLabel(legNumber, c) {
     this.labelsLayer.add(this.createGraphic(vars.circleSymbol, c.geometry));
  }

  public getTotalHopsMaster(id) {
    const count = this.countPointsPerLine(this.routeLine.paths[id], 10);
    return count;
  }

  public getTotalHops(id) {
    return this.allPtArray[id].length;
  }

  public requestData() {
    // tslint:disable-next-line:max-line-length
    this.http.get('http://tfsgis-dfe02.tfs.tamu.edu/arcgis/rest/services/TxScenicViews/ScenicLocations/FeatureServer/3/query?where=objectid+%3D+' + this.masterId + '&f=geojson&returnGeometry=true&outfields=*')
    .pipe(map(response => response.json())).subscribe(d => {
      const _pathArray = [];
      d.features.forEach(_f => {
        _pathArray.push(_f.geometry.coordinates);
      });
      this.routeLine.paths = _pathArray;
      this.prepareForAnimation(this.routeLine);
    });
  }

  public prepareForAnimation(polyline) {
    this.allPtArray = [];
    this.allPtGraphics = [];
    // loop for the all paths inside that polyline
    for (let pthId = 0; pthId < polyline.paths.length; pthId++) {
      // get total hops per individual path sections
      const countPerleg = this.getTotalHopsMaster(pthId);
      // now get all those points
      const ptArraySection = [];
      const ptGraphicsArraySection = [];
      // add first point
      const _ptGraphic = this.createGraphic(vars.markerSymbol,
        {
          type: 'point',
          longitude: polyline.paths[pthId][0][0],
          latitude: polyline.paths[pthId][0][1],
          spatialReference: this.mapView.spatialReference
        });

      ptGraphicsArraySection.push(_ptGraphic);
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
      this.totalPaths = this.allPtArray.length;
    }
    this.addLabel(this.legNumber - 1, this.allPtGraphics[this.legNumber - 1][this.legHop]);
    const e = polyline.extent.clone();
    this.mapView.extent = e.expand(1.5);
    this.mapView.when(() => {
      setTimeout(() => this.animateAll(), 200);
    });
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
    this.mapView.graphics.removeAll();
      const line1 = this.createPolyline(newpaths, 4326);
      const _graphic = this.allPtGraphics[this.legNumber - 1][this.legHop - 1];
      this.lastBearing = (vars.bearing(newpaths) === -9999) ? vars.bearing(newpaths) : this.lastBearing;
      _graphic.symbol.angle = vars.bearing(newpaths);
      const lineGraphic = this.createGraphic(vars.highLightedLineSymbol, line1);
      this.lineLayer.add(lineGraphic);
      if (this.legHop !== 1 && this.legHop !== this.allPtArray[this.legNumber - 1].length) {
        this.mapView.graphics.add(_graphic);
      }

    /* animation logic */
    if (this.legNumber < this.totalPaths) {
      if (this.legHop > (this.getTotalHops(this.legNumber - 1) - 1) && this.legNumber < this.totalPaths) {
        this.addLabel(this.legNumber, this.allPtGraphics[this.legNumber - 1][this.legHop - 1]);
        this.legNumber++;
        // if its the final segment just return
        if (this.legNumber > this.allPtArray.length) {
          return;
        } else {
        this.legHop = 0;
        this.setTimeOutAnimation = setTimeout(() => { this.animateAll(); }, this.delay );
        }
      } else if (this.legHop >= this.getTotalHops(this.legNumber - 1) && this.legNumber > this.totalPaths) {
        return;
      } else {
        this.setTimeOutAnimation = setTimeout(() => {
          requestAnimationFrame(this.animateAll);
          },
        (this.legHop <= 2 && this.legNumber === 1 ) ? 400 : this.delay);
      }
    } else if (this.legHop < this.getTotalHops(this.legNumber - 1)) {
      this.setTimeOutAnimation = setTimeout(() => { this.animateAll(); }, (this.legHop <= 2 && this.legNumber === 1 ) ? 400 : this.delay);
    } else {
      this.addLabel(this.legNumber, this.allPtGraphics[this.legNumber - 1][this.legHop - 1]);
      this.mapView.graphics.removeAll();
      this.isReplayVisible = true;
      console.log('finally done');
    }
  }

  public animate(i) {
    let currentFrame = i;
    const frame = () => {
      currentFrame = currentFrame + 1;
      
    }
  }

  async initializeMap() {

    const [EsriMap, EsriMapView, GraphicsLayer, Graphic, TextSymbol, Polyline, geometryEngine] = await loadModules([
      'esri/Map', 'esri/views/MapView', 'esri/layers/GraphicsLayer', 'esri/Graphic', 'esri/symbols/TextSymbol',
      'esri/geometry/Polyline', 'esri/geometry/geometryEngine',
      'dojo/domReady'
    ]);

    this.map = new EsriMap({ basemap: this._basemap });
    const mapViewProperties: esri.MapViewProperties = {
      container: this.mapViewEl.nativeElement,
      center: this._center,
      zoom: this._zoom,
      map: this.map
    };

    this.mapView = new EsriMapView(mapViewProperties);

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
    this.labelsLayer = new GraphicsLayer();
    this.map.addMany([this.lineLayer, this.labelsLayer]);

    this.routeLine = new Polyline({
      paths: null,
      spatialReference: { wkid: 4326 }
    });


    this.createLabels = (label, geometry) => {
      const _lblSymbol = vars.labelSymbol;
      _lblSymbol.text = label;
      return this.createGraphic(_lblSymbol, geometry);
    };
    this.mapView.when(() => {
      this.requestData();
    });
    return this.mapView;
  }

  ngOnInit() {
    this.initializeMap();
  }

  public replayAnimation() {
    this.isReplayVisible = false;
    clearTimeout(this.setTimeOutAnimation);
    this.legNumber = 1;
    this.legHop = 0;
    this.mapView.graphics.removeAll();
    this.lineLayer.graphics.removeAll();
    this.labelsLayer.graphics.removeAll();
    this.mapView.when(() => {
      this.requestData();
    });
  }

}
