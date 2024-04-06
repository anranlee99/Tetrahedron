class Tetrahedron {
    ctx: CanvasRenderingContext2D;
    size: number;
    vertices: number[][];
    faces: number[][];
    colors: string[];
    rotationX: number;
    rotationY: number;
    fov: number;
    viewerDistance: number;

    constructor(context: CanvasRenderingContext2D, size: number) {
        this.ctx = context;
        this.size = size;
        this.vertices = [
            [0, 0, 1],
            [-1, -1, -1],
            [1, -1, -1],
            [0, 1, -1]
        ];

        this.faces = [
            [0, 1, 2],
            [0, 1, 3],
            [0, 2, 3],
            [1, 2, 3]
        ];

        this.colors = ["red", "green", "blue", "yellow"];

        this.rotationX = 0;
        this.rotationY = 0;
        this.fov = Math.PI;  // Example value, can be adjusted
        this.viewerDistance = 1000;  // Example value, can be adjusted
    }

    rotate(axis: string, theta: number) {
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (const vertex of this.vertices) {
            let x = vertex[0];
            let y = vertex[1];
            let z = vertex[2];
            if (axis === 'x') {
                vertex[1] = y * cosTheta - z * sinTheta;
                vertex[2] = z * cosTheta + y * sinTheta;
            } else if (axis === 'y') {
                vertex[0] = x * cosTheta - z * sinTheta;
                vertex[2] = z * cosTheta + x * sinTheta;
            }
        }
    }

    drawFace(face: number[], color: string) {
        // Project the vertices of the face
        const projectedVertices = face.map(index => this.project(this.vertices[index]));

        // Calculate the winding order using the first three vertices of the face
        const [A, B, C] = projectedVertices;
        const AB = [B[0] - A[0], B[1] - A[1]];
        const AC = [C[0] - A[0], C[1] - A[1]];
        const crossZ = AB[0] * AC[1] - AB[1] * AC[0];

        // Draw the face only if the winding is clockwise (crossZ > 0)
        if (crossZ > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(A[0] * this.size, A[1] * this.size);
            for (let i = 1; i < projectedVertices.length; i++) {
                const [x, y] = projectedVertices[i];
                this.ctx.lineTo(x * this.size, y * this.size);
            }
            this.ctx.closePath();
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    calculateNormal(face: number[]) {
        let v1 = this.vertices[face[0]];
        let v2 = this.vertices[face[1]];
        let v3 = this.vertices[face[2]];
        let normal = [
            (v2[1] - v1[1]) * (v3[2] - v1[2]) - (v2[2] - v1[2]) * (v3[1] - v1[1]),
            (v2[2] - v1[2]) * (v3[0] - v1[0]) - (v2[0] - v1[0]) * (v3[2] - v1[2]),
            (v2[0] - v1[0]) * (v3[1] - v1[1]) - (v2[1] - v1[1]) * (v3[0] - v1[0])
        ];
        let length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
        return [normal[0] / length, normal[1] / length, normal[2] / length];
    }

    draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        for (let i = 0; i < this.faces.length; i++) {
            this.drawFace(this.faces[i], this.colors[i]);
        }

        this.ctx.restore();
    }

    project(vertex: number[]) {
        const scale = 100; // Adjust this value as needed
        const scaledVertex = [vertex[0] * scale, vertex[1] * scale, vertex[2] * scale];
        const factor = this.fov / (this.viewerDistance + scaledVertex[2]);
        return [scaledVertex[0] * factor, scaledVertex[1] * factor];
    }
}

window.onload = function() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = window.innerWidth / 2;
    canvas.height = canvas.width;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    const tetrahedron = new Tetrahedron(context, 500);
    let lastX: number, lastY: number, dragging = false;

    canvas.onmousedown = function(e) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    };

    canvas.onmouseup = canvas.onmouseleave = function() {
        dragging = false;
    };

    canvas.onmousemove = function(e) {
        if (dragging) {
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            tetrahedron.rotate('y', dx * 0.01);
            tetrahedron.rotate('x', dy * 0.01);
            tetrahedron.draw();
        }
    };

    //touch supoprt
    canvas.addEventListener('touchstart', function(e) {
        dragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
    });
    canvas.addEventListener('touchend', function() {
        dragging = false;
    });
    canvas.addEventListener('touchmove', function(e) {
        if (dragging) {
            const dx = e.touches[0].clientX - lastX;
            const dy = e.touches[0].clientY - lastY;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
            tetrahedron.rotate('y', dx * 0.01);
            tetrahedron.rotate('x', dy * 0.01);
            tetrahedron.draw();
        }
    });

    tetrahedron.draw();
};