class Tetrahedron {
    private ctx: CanvasRenderingContext2D;
    private size: number;
    private vertices: number[][];
    private faces: number[][];
    private colors: string[];
    fov: number;
    viewerDistance: number;

    constructor(context: CanvasRenderingContext2D, size: number) {
        this.ctx = context;
        this.size = size;
        this.vertices = this.initVertices();
        this.faces = this.initFaces();
        this.colors = ["red", "green", "blue", "yellow"];

        this.fov = Math.PI; // Example value, adjust as needed
        this.viewerDistance = 1000; // Example value, adjust as needed
    }

    private initVertices(): number[][] {
        const s = 0.612; // Scale factor for the tetrahedron
        return [
            [0, 0, s],
            [0.707, 0, 0],
            [-0.354, 0.612, 0],
            [-0.354, -0.612, 0],
        ];
    }

    private initFaces(): number[][] {
        return [
            [0, 1, 2], // Red
            [0, 2, 3], // Green
            [0, 3, 1], // Blue
            [1, 3, 2], // Yellow
        ];
    }

    rotate(axis: "x" | "y", theta: number): void {
        this.rotateVertices(axis, theta);
    }

    private rotateVertices(axis: "x" | "y", theta: number): void {
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (const vertex of this.vertices) {
            this.rotateVertexAroundCenter(vertex, axis, sinTheta, cosTheta);
        }
    }

    private rotateVertexAroundCenter(
        vertex: number[],
        axis: "x" | "y",
        sinTheta: number,
        cosTheta: number
    ): void {
        const [x, y, z] = vertex;
        if (axis === "x") {
            vertex[1] = y * cosTheta - z * sinTheta;
            vertex[2] = z * cosTheta + y * sinTheta;
        } else if (axis === "y") {
            vertex[0] = x * cosTheta - z * sinTheta;
            vertex[2] = z * cosTheta + x * sinTheta;
        }
    }

    project(vertex: number[]) {
        const scale = 100; // Adjust this scale as needed for your visualization
        const scaledVertex = [vertex[0] * scale, vertex[1] * scale, vertex[2] * scale];
        const factor = this.fov / (this.viewerDistance + scaledVertex[2]);
        return [scaledVertex[0] * factor, scaledVertex[1] * factor];
    }


    draw(): void {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        const faceNormalsAndDepths = this.faces.map((face, index) => { // Include original index
            const [a, b, c] = face.map(i => this.vertices[i]);
            const normal = this.calculateNormal(a, b, c);
            const avgZ = (a[2] + b[2] + c[2]) / 3;
            return { face, normal, avgZ, index }; // Store original index
        });

        const visibleFaces = faceNormalsAndDepths
            .filter(faceInfo => faceInfo.normal[2] > 0) // Back-face culling
            .sort((a, b) => b.avgZ - a.avgZ); // Depth sorting (draw closer faces last)

        visibleFaces.forEach(({ face, index }) => {
            this.drawFace(face, this.colors[index % this.colors.length]); // Use original index for color
        });

        this.ctx.restore();
    }


    calculateNormal(a: number[], b: number[], c: number[]) {
        // Compute vectors
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];

        // Cross product
        return [
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0]
        ];
    }



    drawFace(face: number[], color: string) {
        const projectedVertices = face.map(index => this.project(this.vertices[index]));

        this.ctx.beginPath();
        this.ctx.moveTo(projectedVertices[0][0] * this.size, projectedVertices[0][1] * this.size);
        for (let i = 1; i < projectedVertices.length; i++) {
            this.ctx.lineTo(projectedVertices[i][0] * this.size, projectedVertices[i][1] * this.size);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.stroke();
    }

}

// Example usage:
window.onload = function () {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = window.innerWidth / 2;
    canvas.height = canvas.width;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    const tetrahedron = new Tetrahedron(context, 500);
    let lastX: number, lastY: number, dragging = false;

    canvas.onmousedown = function (e) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    };

    canvas.onmouseup = canvas.onmouseleave = function () {
        dragging = false;
    };

    canvas.onmousemove = function (e) {
        if (dragging) {
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            tetrahedron.rotate('y', -dx * 0.01);
            tetrahedron.rotate('x', -dy * 0.01);
            tetrahedron.draw();
        }
    };

    tetrahedron.draw();
};