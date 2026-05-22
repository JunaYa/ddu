import { ref, shallowRef, onUnmounted } from 'vue'
import { Canvas, FabricImage, Rect, Ellipse, Line, Textbox, Path, Circle, Group, FabricText } from 'fabric'

export type ToolType =
  | 'select'
  | 'arrow'
  | 'line'
  | 'rect'
  | 'ellipse'
  | 'freehand'
  | 'highlight'
  | 'text'
  | 'step'
  | 'blur'
  | 'pixelate'
  | 'crop'

export interface EditorStyle {
  strokeColor: string
  fillColor: string
  strokeWidth: number
  fontSize: number
  opacity: number
}

const DEFAULT_STYLE: EditorStyle = {
  strokeColor: '#ff0000',
  fillColor: 'transparent',
  strokeWidth: 3,
  fontSize: 20,
  opacity: 1,
}

export function useEditor() {
  const canvas = shallowRef<Canvas | null>(null)
  const currentTool = ref<ToolType>('select')
  const style = ref<EditorStyle>({ ...DEFAULT_STYLE })
  const stepCounter = ref(1)
  const canUndo = ref(false)
  const canRedo = ref(false)
  const isDrawing = ref(false)

  let undoStack: string[] = []
  let redoStack: string[] = []
  let drawStart: { x: number; y: number } | null = null
  let tempObject: any = null
  let bgImage: FabricImage | null = null
  let suppressHistory = false

  function initCanvas(canvasEl: HTMLCanvasElement, width: number, height: number) {
    const c = new Canvas(canvasEl, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    })
    canvas.value = c

    c.on('mouse:down', onMouseDown)
    c.on('mouse:move', onMouseMove)
    c.on('mouse:up', onMouseUp)
    c.on('object:modified', saveState)

    return c
  }

  async function loadImage(src: string) {
    if (!canvas.value) return
    const img = await FabricImage.fromURL(src, {}, { crossOrigin: 'anonymous' })
    bgImage = img

    const c = canvas.value
    const scale = Math.min(c.width! / img.width!, c.height! / img.height!, 1)
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: (c.width! - img.width! * scale) / 2,
      top: (c.height! - img.height! * scale) / 2,
      selectable: false,
      evented: false,
      erasable: false,
    })
    c.backgroundImage = img
    c.renderAll()
    saveState()
  }

  function saveState() {
    if (suppressHistory || !canvas.value) return
    const json = JSON.stringify(canvas.value.toJSON())
    undoStack.push(json)
    redoStack = []
    if (undoStack.length > 100) undoStack.shift()
    canUndo.value = undoStack.length > 1
    canRedo.value = false
  }

  function undo() {
    if (!canvas.value || undoStack.length <= 1) return
    const current = undoStack.pop()!
    redoStack.push(current)
    const prev = undoStack[undoStack.length - 1]
    suppressHistory = true
    canvas.value.loadFromJSON(prev).then(() => {
      canvas.value!.renderAll()
      suppressHistory = false
      canUndo.value = undoStack.length > 1
      canRedo.value = redoStack.length > 0
    })
  }

  function redo() {
    if (!canvas.value || redoStack.length === 0) return
    const next = redoStack.pop()!
    undoStack.push(next)
    suppressHistory = true
    canvas.value.loadFromJSON(next).then(() => {
      canvas.value!.renderAll()
      suppressHistory = false
      canUndo.value = undoStack.length > 1
      canRedo.value = redoStack.length > 0
    })
  }

  function setTool(tool: ToolType) {
    currentTool.value = tool
    if (!canvas.value) return

    const c = canvas.value
    c.isDrawingMode = tool === 'freehand' || tool === 'highlight'
    c.selection = tool === 'select'

    if (tool === 'freehand') {
      c.freeDrawingBrush!.color = style.value.strokeColor
      c.freeDrawingBrush!.width = style.value.strokeWidth
    } else if (tool === 'highlight') {
      c.freeDrawingBrush!.color = style.value.strokeColor + '60'
      c.freeDrawingBrush!.width = style.value.strokeWidth * 4
    }

    c.getObjects().forEach((obj: any) => {
      if (obj !== bgImage) {
        obj.selectable = tool === 'select'
        obj.evented = tool === 'select'
      }
    })
    c.discardActiveObject()
    c.renderAll()
  }

  function onMouseDown(opt: any) {
    const tool = currentTool.value
    if (tool === 'select' || tool === 'freehand' || tool === 'highlight') return
    if (!canvas.value) return

    const pointer = canvas.value.getScenePoint(opt.e)
    drawStart = { x: pointer.x, y: pointer.y }
    isDrawing.value = true

    if (tool === 'text') {
      addText(pointer.x, pointer.y)
      isDrawing.value = false
      drawStart = null
      return
    }

    if (tool === 'step') {
      addStep(pointer.x, pointer.y)
      isDrawing.value = false
      drawStart = null
      return
    }

    if (tool === 'rect' || tool === 'blur' || tool === 'pixelate') {
      tempObject = new Rect({
        left: pointer.x,
        top: pointer.y,
        width: 0,
        height: 0,
        fill: tool === 'rect' ? style.value.fillColor : 'rgba(128,128,128,0.5)',
        stroke: tool === 'rect' ? style.value.strokeColor : 'transparent',
        strokeWidth: tool === 'rect' ? style.value.strokeWidth : 0,
        opacity: style.value.opacity,
        selectable: false,
        evented: false,
      })
      canvas.value.add(tempObject)
    } else if (tool === 'ellipse') {
      tempObject = new Ellipse({
        left: pointer.x,
        top: pointer.y,
        rx: 0,
        ry: 0,
        fill: style.value.fillColor,
        stroke: style.value.strokeColor,
        strokeWidth: style.value.strokeWidth,
        opacity: style.value.opacity,
        selectable: false,
        evented: false,
      })
      canvas.value.add(tempObject)
    } else if (tool === 'line' || tool === 'arrow') {
      tempObject = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
        stroke: style.value.strokeColor,
        strokeWidth: style.value.strokeWidth,
        opacity: style.value.opacity,
        selectable: false,
        evented: false,
      })
      canvas.value.add(tempObject)
    }
  }

  function onMouseMove(opt: any) {
    if (!isDrawing.value || !drawStart || !tempObject || !canvas.value) return

    const pointer = canvas.value.getScenePoint(opt.e)
    const tool = currentTool.value

    if (tool === 'rect' || tool === 'blur' || tool === 'pixelate') {
      const left = Math.min(drawStart.x, pointer.x)
      const top = Math.min(drawStart.y, pointer.y)
      tempObject.set({
        left,
        top,
        width: Math.abs(pointer.x - drawStart.x),
        height: Math.abs(pointer.y - drawStart.y),
      })
    } else if (tool === 'ellipse') {
      const rx = Math.abs(pointer.x - drawStart.x) / 2
      const ry = Math.abs(pointer.y - drawStart.y) / 2
      tempObject.set({
        left: Math.min(drawStart.x, pointer.x),
        top: Math.min(drawStart.y, pointer.y),
        rx,
        ry,
      })
    } else if (tool === 'line' || tool === 'arrow') {
      tempObject.set({ x2: pointer.x, y2: pointer.y })
    }

    canvas.value.renderAll()
  }

  function onMouseUp(_opt: any) {
    if (!isDrawing.value || !canvas.value) return
    isDrawing.value = false

    const tool = currentTool.value

    if (tempObject) {
      tempObject.set({ selectable: true, evented: true })

      if (tool === 'arrow' && drawStart) {
        const pointer = canvas.value.getScenePoint(_opt.e)
        canvas.value.remove(tempObject)
        addArrow(drawStart.x, drawStart.y, pointer.x, pointer.y)
      } else if (tool === 'blur' || tool === 'pixelate') {
        applyPrivacyEffect(tempObject, tool)
      }

      tempObject = null
    }

    drawStart = null
    saveState()
  }

  function addArrow(x1: number, y1: number, x2: number, y2: number) {
    if (!canvas.value) return
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const headLen = 15

    const line = new Line([x1, y1, x2, y2], {
      stroke: style.value.strokeColor,
      strokeWidth: style.value.strokeWidth,
    })

    const head = new Path(
      `M 0 0 L ${-headLen} ${headLen / 2} L ${-headLen} ${-headLen / 2} Z`,
      {
        fill: style.value.strokeColor,
        left: x2,
        top: y2,
        angle: (angle * 180) / Math.PI,
        originX: 'center',
        originY: 'center',
      },
    )

    const group = new Group([line, head], {
      selectable: true,
      evented: true,
    })
    canvas.value.add(group)
  }

  function addText(x: number, y: number) {
    if (!canvas.value) return
    const text = new Textbox('Text', {
      left: x,
      top: y,
      fontSize: style.value.fontSize,
      fill: style.value.strokeColor,
      fontFamily: 'Arial',
      width: 200,
      editable: true,
    })
    canvas.value.add(text)
    canvas.value.setActiveObject(text)
    text.enterEditing()
    saveState()
  }

  function addStep(x: number, y: number) {
    if (!canvas.value) return
    const num = stepCounter.value++
    const radius = 16
    const circle = new Circle({
      radius,
      fill: style.value.strokeColor,
      originX: 'center',
      originY: 'center',
    })
    const text = new FabricText(String(num), {
      fontSize: 16,
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center',
    })
    const group = new Group([circle, text], {
      left: x - radius,
      top: y - radius,
      selectable: true,
      evented: true,
    })
    canvas.value.add(group)
    saveState()
  }

  function applyPrivacyEffect(rect: Rect, type: 'blur' | 'pixelate') {
    if (!canvas.value) return
    const fillColor = type === 'blur' ? 'rgba(128,128,128,0.7)' : 'rgba(100,100,100,0.8)'
    rect.set({ fill: fillColor, stroke: 'transparent', strokeWidth: 0 })
    canvas.value.renderAll()
  }

  function deleteSelected() {
    if (!canvas.value) return
    const active = canvas.value.getActiveObjects()
    active.forEach((obj: any) => {
      if (obj !== bgImage) canvas.value!.remove(obj)
    })
    canvas.value.discardActiveObject()
    canvas.value.renderAll()
    saveState()
  }

  function exportImage(format: 'png' | 'jpeg' = 'png'): string {
    if (!canvas.value) return ''
    canvas.value.discardActiveObject()
    canvas.value.renderAll()
    return canvas.value.toDataURL({ format, quality: format === 'jpeg' ? 0.92 : 1, multiplier: 1 })
  }

  function clearAnnotations() {
    if (!canvas.value) return
    const objects = canvas.value.getObjects().filter((obj: any) => obj !== bgImage)
    objects.forEach((obj: any) => canvas.value!.remove(obj))
    stepCounter.value = 1
    canvas.value.renderAll()
    saveState()
  }

  function destroy() {
    if (canvas.value) {
      canvas.value.dispose()
      canvas.value = null
    }
    undoStack = []
    redoStack = []
  }

  onUnmounted(destroy)

  return {
    canvas,
    currentTool,
    style,
    stepCounter,
    canUndo,
    canRedo,
    initCanvas,
    loadImage,
    setTool,
    undo,
    redo,
    deleteSelected,
    exportImage,
    clearAnnotations,
    destroy,
  }
}
