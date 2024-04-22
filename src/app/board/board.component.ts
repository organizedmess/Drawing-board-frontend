import { Component, ViewChild, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { CanvaService } from '../canva.service';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})

export class BoardComponent{

  prevMouseX: number = 0;
  prevMouseY: number = 0;
  snapshot : ImageData | null = null;

  isDrawing: boolean = false;
  selectedTool: string = 'brush';
  brushWidth: number = 5;
  selectedColor = '#000000';
  selectedColorElement: HTMLElement | null = null;
  snapshots: ImageData[] = [];
  sliderValue: number = 5;
  fillColor = false;
  mode: string = '';

  socket!: Socket;

  private canvas: HTMLCanvasElement | null = null;
  private ctx:any = null;

  roomId: string = '';
  constructor(
              private snackBar: MatSnackBar,
              private router: Router, 
              private route: ActivatedRoute,
              private canvasService: CanvaService
            ) {}
  
  ngAfterViewInit() {}
  
  ngOnInit() {
    this.roomId = this.route.snapshot.params['id'] || "";
    this.mode = this.route.snapshot.params['mode'] || "";
    this.setupSocketConnection();
    this.canvas = document.querySelector('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext('2d');
    this.OnLoad();
  }
  
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  horizontalPosition: MatSnackBarHorizontalPosition = 'left';
  setupSocketConnection() {
    this.socket = io(environment.SOCKET_ENDPOINT);

    if(this.mode === 'create'){
      console.log('Creating room')
      this.socket.emit('create-room', this.roomId);
    }
    else if(this.mode === 'join'){
      this.socket.emit('join-room', this.roomId);
      console.log('Joining room')
      
      this.socket.on('join-room', (data: any) => {
        console.log(data);
        if(data === -1){
          this.snackBar.open('Room not found', '', {
            duration: 2000,
            verticalPosition: this.verticalPosition,
            horizontalPosition: this.horizontalPosition,
          });
          this.router.navigate(['/']);
        }
        else{
          this.snackBar.open('Room joined', '', {
            duration: 2000,
            verticalPosition: this.verticalPosition,
            horizontalPosition: this.horizontalPosition,
          });
          let img = new Image();
          img.src = data;
          img.onload = () => {
            this.ctx?.drawImage(img, 0, 0);
          }
        }
      });  
    }

    this.socket.on('drawing', (data: any) => {
      switch (data.type) {
      
        case 'brush':
          this.updateOnBrushTool(data);
          break;
        case 'rectangle':
          this.updateOnRectangleTool(data);
          break;
        case 'circle':
          this.updateOnCircleTool(data);
          break;
        case 'triangle':
          this.updateOnTriangleTool(data);
          break;
        case 'line':
          this.updateOnLineTool(data);
          break;
        default:
          break;
      }

    });
  }


  handleDrawingEvent(event: MouseEvent, prevPoint: any): void {
    switch (this.selectedTool) {
      case 'brush':
      case 'eraser':
        this.sendDrawingUpdate({ type: 'brush', ...this.getBrushEventData(event, prevPoint) });
        break;
      case 'rectangle':
        this.sendDrawingUpdate({ type: 'rectangle', ...this.getRectangleEventData(event) });
        break;
      case 'circle':
        this.sendDrawingUpdate({ type: 'circle', ...this.getCircleEventData(event) });
        break;
      case 'triangle':
        this.sendDrawingUpdate({ type: 'triangle', ...this.getTriangleEventData(event) });
        break;
      case 'line':
        this.sendDrawingUpdate({ type: 'line', ...this.getLineEventData(event) });
        break;
      default:
        break;
    }
  }
  sendDrawingUpdate(data: any): void{
    this.socket.emit('drawing', data);
  }

  temp_prev = {x: -1, y: -1};
  getBrushEventData(event: MouseEvent, prevPoint: any): any {
    if(prevPoint.x === -1 && prevPoint.y === -1){
      prevPoint.x = event.offsetX;
      prevPoint.y = event.offsetY;
    }
    return {
      startX: prevPoint.x,
      startY: prevPoint.y,
      endX: event.offsetX,
      endY: event.offsetY,
      color: this.selectedTool === 'brush' ? this.selectedColor : '#ffffff',
      lineWidth: this.brushWidth
    };
  }
  updateOnBrushTool(data: any): void {
    if (!this.ctx) return;
    const { startX, startY, endX, endY, color, lineWidth } = data;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx?.lineTo(endX, endY);

    this.ctx?.stroke();

  }
  
  getRectangleEventData(event: MouseEvent): any {
    // console.log(this.fillColor?.checked)
    return {
      startX: this.prevMouseX,
      startY: this.prevMouseY,
      endX: event.offsetX,
      endY: event.offsetY,
      color: this.selectedColor,
      lineWidth: this.brushWidth,
      fill: this.fillColor
    };
  }
  updateOnRectangleTool(data: any): void {
    if (!this.ctx) return;
    const { startX, startY, endX, endY, color, lineWidth, fill} = data;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;

    let width = endX - startX;
    let height = endY - startY; 

    if(fill){
      console.log('filling')
      this.ctx.fillStyle = color;
      this.ctx.fillRect(startX, startY, width, height);
    }
    else{
      console.log('not filling')
      this.ctx.strokeRect(startX, startY, width, height);
    }
  }

  getCircleEventData(event: MouseEvent): any {
    return {
      startX: this.prevMouseX,
      startY: this.prevMouseY,
      endX: event.offsetX,
      endY: event.offsetY,
      color: this.selectedColor,
      lineWidth: this.brushWidth,
      fill: this.fillColor
    };
  }
  updateOnCircleTool(data: any): void {
    if (!this.ctx) return;
    const { startX, startY, endX, endY, color, lineWidth, fill } = data;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;

    let radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
    this.ctx.beginPath();
    this.ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
    
    if(fill){
      console.log('filling')
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }
    else{
      console.log('not filling')
      this.ctx.stroke();
    }
  }

  getTriangleEventData(event: MouseEvent): any {
    return {
      startX: this.prevMouseX,
      startY: this.prevMouseY,
      endX: event.offsetX,
      endY: event.offsetY,
      color: this.selectedColor,
      lineWidth: this.brushWidth,
      fill: this.fillColor
    };
  }
  updateOnTriangleTool(data: any): void {
    if (!this.ctx) return;
    const { startX, startY, endX, endY, color, lineWidth, fill } = data;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.lineTo(startX * 2 - endX, endY);
    this.ctx.closePath();

    if(fill){
      console.log('filling')
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }
    else{
      console.log('not filling')
      this.ctx.stroke();
    }
  }

  getLineEventData(event: MouseEvent): any {
    return {
      startX: this.prevMouseX,
      startY: this.prevMouseY,
      endX: event.offsetX,
      endY: event.offsetY,
      color: this.selectedColor,
      lineWidth: this.brushWidth
    };
  }
  updateOnLineTool(data: any): void {
    if (!this.ctx) return;
    const { startX, startY, endX, endY, color, lineWidth } = data;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx?.lineTo(endX, endY);
    this.ctx?.stroke();
  }

  setCanvasBackground() {
    this.canvas = document.querySelector("canvas");
    this.ctx = this.canvas?.getContext("2d");

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas?.width, this.canvas?.height);
    this.ctx.fillStyle = this.selectedColor;
  }

  OnLoad(){
    this.canvas = document.querySelector('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext('2d') as CanvasRenderingContext2D;
    this.selectedColorElement = document.querySelector('.selected') as HTMLElement;

    
    if(!this.canvas || !this.ctx) return;

    // console.log('Canvas Loaded');
    this.canvas.width = this.canvas?.offsetWidth;
    this.canvas.height = this.canvas?.offsetHeight;

    this.setCanvasBackground();
  }

  startDrawing(e: MouseEvent) {
    if(!this.canvas || !this.ctx) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDrawing = true;
    this.ctx.lineWidth = this.brushWidth;
    this.ctx.strokeStyle = this.selectedColor;
    this.ctx.fillStyle = this.selectedColor;

    this.prevMouseX = e.offsetX;
    this.prevMouseY = e.offsetY;

    this.ctx.beginPath();
    this.ctx.moveTo(e.offsetX, e.offsetY);
    this.snapshot = this.ctx.getImageData(0, 0, this.canvas?.width, this.canvas?.height);
  }

  DrawingBrush(e: MouseEvent) {
    if (!this.isDrawing) return;
    if (!this.canvas || !this.ctx) return;
    
    if (this.selectedTool !== "brush" && this.selectedTool !== "eraser") return;
    
    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.strokeStyle = this.selectedTool === "brush" ? this.selectedColor : "#ffffff";
    this.ctx.stroke();
    
    this.handleDrawingEvent(e, this.temp_prev);
    this.temp_prev = {x: e.offsetX, y: e.offsetY};
  }

  stopDrawing(e: MouseEvent) {
    if (!this.isDrawing) return;

    this.temp_prev = {x: -1, y: -1};

    if(this.selectedTool !== 'brush' && this.selectedTool !== 'eraser'){
      this.handleDrawingEvent(e, {x: this.prevMouseX, y: this.prevMouseY});
    }
    this.isDrawing = false;
    this.socket.emit('update-canvas', { roomId: this.roomId, canvaData: this.canvas?.toDataURL() });
  }

  drawRect(e: MouseEvent) {
    if(!this.isDrawing || this.selectedTool !== 'rectangle') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    this.ctx.lineTo(e.offsetX, e.offsetY);
    
    let width = e.offsetX - this.prevMouseX;
    let height = e.offsetY - this.prevMouseY;
    
    let fillColor = document.querySelector("#fill-color") as HTMLInputElement;
    if(this.isDrawing) this.ctx.putImageData(this.snapshot, 0, 0);

    if(!fillColor?.checked){
      this.fillColor = false;
      return this.ctx.strokeRect(this.prevMouseX, this.prevMouseY, width, height);
    }
    else{
      this.fillColor = true;
      return this.ctx.fillRect(this.prevMouseX, this.prevMouseY, width, height);
    }
  }

  drawCircle(e: MouseEvent) {
    if(!this.isDrawing || this.selectedTool !== 'circle') return;

    let fillColor = document.querySelector("#fill-color") as HTMLInputElement;

    this.ctx.beginPath();
    let radius = Math.sqrt(Math.pow(this.prevMouseX - e.offsetX, 2) + Math.pow(this.prevMouseY - e.offsetY, 2));
    this.ctx.arc(this.prevMouseX, this.prevMouseY, radius, 0, 2 * Math.PI);

    if(this.isDrawing) this.ctx.putImageData(this.snapshot, 0, 0);
    this.fillColor = fillColor.checked;
    fillColor?.checked ? this.ctx.fill() : this.ctx.stroke();
  }

  drawTraingle(e: MouseEvent){
    if(!this.isDrawing || this.selectedTool !== 'triangle') return;
    let fillColor = document.querySelector("#fill-color") as HTMLInputElement;
    if(this.isDrawing) this.ctx.putImageData(this.snapshot, 0, 0);

    this.ctx.beginPath();
    this.ctx.moveTo(this.prevMouseX, this.prevMouseY);
    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.lineTo(this.prevMouseX * 2 - e.offsetX, e.offsetY);
    this.ctx.closePath();
    fillColor?.checked ? this.ctx.fill() : this.ctx.stroke();
    this.fillColor = fillColor.checked;
  }

  drawLine(e: MouseEvent){
    if(!this.isDrawing || this.selectedTool !== 'line') return;
    if(this.isDrawing) this.ctx.putImageData(this.snapshot, 0, 0);
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.prevMouseX, this.prevMouseY);
    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.stroke();
  }

  ToolChange(tool: string){
    let Current_tool = document.querySelector('.active') as HTMLElement;
    console.log(Current_tool)
    Current_tool.classList.remove('active');

    let selectedElement = document.querySelector(`#${tool}`) as HTMLElement;
    selectedElement.classList.add('active');
    this.selectedTool = tool;

    let body = document.body as HTMLElement;

    let scaled_slider_value = this.sliderValue/16;
    if(this.selectedTool === 'eraser'){
      body.style.cursor = `url('../assets/eraser.png') 32 32, auto`;
    }
    else{
      body.style.cursor = 'default';
    }
  }

  ClearCanvas() {
    this.canvas = document.querySelector('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    
    if (!this.canvas || !this.ctx) return;

    if(window.confirm('Are you sure you want to clear the canvas?')){
      this.ctx.clearRect(0, 0, this.canvas?.width || 0, this.canvas?.height || 0);
      return ;
    }
    else{
      return;
    }
  }

  SaveImage() {
    this.canvas = document.querySelector('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');
    // let saveImg = document.querySelector('#save-img') as HTMLButtonElement;

    let link = document.createElement('a');
    link.download = `${Date.now()}.jpg`;
    
    link.href = this.canvas?.toDataURL();
    link.click();
  }

  SizeSlider(){
    let slider = document.querySelector('#size-slider') as HTMLInputElement;
    this.brushWidth = parseInt(slider.value);
    this.sliderValue = parseInt(slider.value);
  }

  CustomColorChange(){
    let colorPicker = document.querySelector('#color-picker') as HTMLInputElement;
    
    if(!colorPicker || !colorPicker.parentElement) return;
    colorPicker.parentElement.click();

    this.selectedColorElement?.classList.remove('selected');
    colorPicker.classList.add('selected');

    this.selectedColor = colorPicker.value;
  }
  
  ColorPicker(event: Event, color: string){
    let element = event.target as HTMLInputElement;
    this.selectedColorElement?.classList.remove('selected');
    element.classList.add('selected');

    this.selectedColor = color;
    console.log()
    
    this.selectedColorElement = element;
  }

  CopyToClipboard(){
    this.snackBar.open("Copied to clipboard", '', {
      duration: 2000,
      verticalPosition: this.verticalPosition,
      horizontalPosition: this.horizontalPosition,
    });

    navigator.clipboard.writeText(this.roomId);
  }

}
