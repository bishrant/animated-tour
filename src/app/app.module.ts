import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { EsrimapComponent } from './components/esrimap/esrimap.component';
import { HttpModule } from '@angular/http';

@NgModule({
  declarations: [
    AppComponent,
    EsrimapComponent
  ],
  imports: [
    HttpModule,
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
