import { Component, Input,OnInit } from '@angular/core';

import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbUserModule
} from "@nebular/theme";
import { time } from 'console';

@Component({

  selector: 'app-accueil',
  standalone: true,
  imports: [NbCardModule,
    NbIconModule,
    NbButtonGroupModule,
    NbButtonModule,
    NbUserModule],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss'
})
export class AccueilComponent {
  @Input() post: any;

  title: string;
  content: string
  picture: string;
  date: Date;
  flopper: string;
  timePassed: number = 0;
  news: string;

  constructor() {
    this.title = "Title";
    this.content = "Content";
    this.picture = "https://www.bing.com/images/search?view=detailV2&ccid=y5B2sz74&id=27C97C54D46F3D460887EDD06B2E2D76D876877E&thid=OIP.y5B2sz74PMG3Cz2YgM-MSwHaFj&mediaurl=https%3a%2f%2fstorage.googleapis.com%2fturbomosaic-res%2fassets%2fimages%2fpicture-of-pictures%2fpicture-of-pictures.jpg&cdnurl=https%3a%2f%2fth.bing.com%2fth%2fid%2fR.cb9076b33ef83cc1b70b3d9880cf8c4b%3frik%3dfod22HYtLmvQ7Q%26pid%3dImgRaw%26r%3d0&exph=600&expw=800&q=picture&simid=608047132181556907&FORM=IRPRST&ck=537A3F4205121B4029BA96CCBFABA337&selectedIndex=9&itb=0";
    this.date = new Date();
    this.flopper = "Flopper";
    this.news = "News";
}
}
