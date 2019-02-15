import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { EsrimapComponent } from './components/esrimap/esrimap.component';

@NgModule({
  declarations: [
    AppComponent,
    EsrimapComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
