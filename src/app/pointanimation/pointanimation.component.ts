import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { loadModules } from 'esri-loader';
// import esri = __esri; // Esri TypeScript Types
import * as vars from '../components/esrimap/variables';

@Component({
  selector: 'app-pointanimation',
  templateUrl: './pointanimation.component.html',
  styleUrls: ['./pointanimation.component.css']
})
export class PointanimationComponent implements OnInit {

  @ViewChild('mapViewNode') private mapViewEl: ElementRef;
  private _zoom = 11;
  private _center: Array<number> = [-95.118420276135581, 31.072854453305986];
  private _basemap = 'hybrid';
  public mapView: any;//__esri.MapView;
  public map: any; //__esri.Map;
  public createGraphic;

  @Input() masterId;
  public ptArray = vars.line1;

  constructor() { }
  async initializeMap() {
    const [EsriMap, EsriMapView, GraphicsLayer, Graphic, TextSymbol, Polyline, geometryEngine] = await loadModules([
      'esri/Map', 'esri/views/MapView', 'esri/layers/GraphicsLayer', 'esri/Graphic', 'esri/symbols/TextSymbol',
      'esri/geometry/Polyline', 'esri/geometry/geometryEngine',
      'dojo/domReady'
    ]);

    this.map = new EsriMap({ basemap: this._basemap });
    const mapViewProperties: any = {
      container: this.mapViewEl.nativeElement,
      center: this._center,
      zoom: this._zoom,
      map: this.map
    };

    this.mapView = new EsriMapView(mapViewProperties);

    this.createGraphic = (s, g) => {
      return new Graphic({ geometry: g, symbol: s });
    };
    console.log(this.ptArray);
    this.mapView.when(() => {
      this.animate(0, 0);
    });

    return this.mapView;
  }

public animatePt(leg, i) {
  const g = this.createGraphic(vars.markerSymbol, {
    type: 'point', longitude: this.ptArray[leg][i][0], latitude: this.ptArray[leg][i][1], spatialReference: this.mapView.spatialReference
  });
  this.mapView.graphics.removeAll();
  this.mapView.graphics.add(g);
}



  public animate(leg, i) {
    let currentFrame = i;
    console.log(i);
    const frame = () => {
      // console.log(11, this.stepNumber);
      currentFrame = currentFrame + 1;
      console.log(currentFrame, leg, this.ptArray.length, i,  this.ptArray[0].length);
      if (leg > this.ptArray.length - 1) {
        currentFrame = 0;
        leg = 0;
        return;
      }
      if (currentFrame >= this.ptArray[leg].length - 1) {
        currentFrame = 0;
        if (leg >= this.ptArray.length - 1) { return; }
        leg = leg + 1;
      }

      this.animatePt(leg, currentFrame);

      const intervalFunc = setTimeout(function () {
        requestAnimationFrame(frame);
      }, currentFrame < 2 ? 200 : 16);
    };

    frame();
  }


  ngOnInit() {
    this.initializeMap();
  }

}
