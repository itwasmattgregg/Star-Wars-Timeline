import './styles/main.css';
import { TimelineScene } from './scene/TimelineScene';
import { initUI } from './ui/controls';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const scene = new TimelineScene(canvas);
initUI(scene);
