import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { EsrimapComponent } from './components/esrimap/esrimap.component';
import { PointanimationComponent } from './pointanimation/pointanimation.component';

@NgModule({
  declarations: [
    AppComponent,
    EsrimapComponent,
    PointanimationComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
