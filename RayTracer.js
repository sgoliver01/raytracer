/* A skeleton of this file was written by Duncan Levear in Spring 2023 for CS3333 at Boston College */
import {Vector3, vectorSum, vectorDifference, vectorScaled} from './Vector3.js'



export class RayTracer {
    constructor(sceneInfo, image) {
        this.scene = sceneInfo;
        this.image = image;
        // clear image all white
        for (let i = 0; i < image.data.length; i++) {
            image.data[i] = 255;
        }
    }

    putPixel(row, col, r, g, b) {
        /*
        Update one pixel in the image array. (r,g,b) are 0-255 color values.
        */
        if (Math.round(row) != row) {
            console.error("Cannot put pixel in fractional row");
            return;
        }
        if (Math.round(col) != col) {
            console.error("Cannot put pixel in fractional col");
            return;
        }
        if (row < 0 || row >= this.image.height) {
            return;
        }
        if (col < 0 || col >= this.image.width) {
            return;
        }

        const index = 4 * (this.image.width * row + col);
        this.image.data[index + 0] = Math.round(r);
        this.image.data[index + 1] = Math.round(g);
        this.image.data[index + 2] = Math.round(b);
        this.image.data[index + 3] = 255;
    }

    render() {
        /*
        For every pixel of this.image, compute its color, then use putPixel() to set it. 
        */
        // TODO
        
        // 1. For Each Pixel
        for (let row=0; row < this.image.height; row++) {
            for (let col=0; col < this.image.width; col++) {
    
                // 2. Compute ray
                const ray = this.pixelToRay(row,col)
                
                const color = this.traceRay(ray)
                
                this.putPixel(row,col,color.x, color.y, color.z)
            }
        }
    }
        
    pixelToRay(row, col) {
        /*
        Convert from pixel coordinate (row,col) to a viewing ray. Return an instance of the Ray class. 
        */
        // TODO
        const x = (col-.5*this.image.width)/this.image.width; // goes from -0.5 (left) to 0.5 (right)
        const y = (.5*this.image.height-row)/this.image.height; // goes from -0.5 (bottom) to 0.5 (top)
        const ray = new Ray(new Vector3(0,0,0),new Vector3(x, y, -1)); 
        return ray
    }
    
    traceRay(ray) {
        /*
        Determine the color of the given ray based on this.scene.
        */
        // TODO
        
        const hits = ray.allHits(this.scene.a_geometries);
        return this.getColor(hits)
        
    }
    
    getColor(record) {
        /*
        Determine the color that results from the given HitRecord.
        */
        // TODO        
        
        //for loop goes thru each light source --> think this needs to go after finding the first intersection
        const lights = this.scene.a_lights
        for (var i = 0; i <lights.length; i++) {
            //(lights[i].v3_position)
            const light = lights[i]
            
           
               
                
            if (record.length > 0) {
                

                const cmp = (a,b) => a.t-b.t || isNaN(a.t)-isNaN(b.t);
                const sortedrecord = record.sort(cmp)
                
     
                const color = sortedrecord[0].struckGeometry.j_material.v3_diffuse
                
                
                const color_without_shading = new Vector3(color.x*255, color.y*255, color.z*255)
                
                
                const final_light = this.whatLight(sortedrecord[0], color_without_shading ,light)
                return (final_light)
            }
            else {
                
                return new Vector3(0,0,0) 
            }
    }
    

    }
 
    
    // To add shading, break it into steps: whatLight(), diffuse(), highlight(), or similar
    whatLight(hit, original_color, light_source) {
        
        
        const specularity_power = hit.struckGeometry.j_material.f_specularity
        const dif_light = this.diffuse(hit, light_source) 
        const spec_light = this.specular(hit, light_source, specularity_power)
     
    //    return new Vector3(255*dif_light + spec_light, 255*dif_light + spec_light, 255*dif_light + spec_light); 
        
       
        //compute shadow and return black if shadow is there
        const point = hit.pt
        const shadowRay_dir = vectorDifference(point, light_source.v3_position)
        
        const shadowRay = new Ray(point, shadowRay_dir)
        
      
            const shadow_hit = shadowRay.allHits(this.scene.a_geometries)
            
        //    console.log(shadow_hit)
            for (const i in shadow_hit) {
                const one_record = (shadow_hit[i])

            if (one_record.t > 0.0001 && one_record.t < 1) {
            console.log("SHADOW")
            // pt is in shadow, return black
            return [0, 0, 0];
        }
            }

        

    
        
        
        const final_light = new Vector3((original_color.x * dif_light), ( original_color.y * dif_light),(original_color.z *dif_light))
        
        const final_fr_thisTime = vectorSum(final_light, spec_light)
     
        return final_fr_thisTime
    }
    
    diffuse(hit, light_source) { //lambert computation
        
        const light_pos = light_source.v3_position
        const point = hit.pt
        
        const toLight = vectorDifference(light_pos, point)
        const normal = hit.normal
        const alignment = toLight.dotProduct(normal)
    
        var m = alignment/(Math.sqrt(toLight.dotProduct(toLight)) * Math.sqrt(normal.dotProduct(normal)))
        
         if (m < 0) {
            m = 0
        }
        
        return m
        
    }
    
    specular(hit, light_source, specularity_power) {      //phong computation

        const point = hit.pt

        const to_eye = vectorDifference(this.scene.v3_eye, point)
        const light_pos = light_source.v3_position
        const toLight = vectorDifference(light_pos, point)
        const normal = hit.normal
        
        const alpha = 2*toLight.dotProduct(normal)/ (normal.dotProduct(normal))
        
        const outgoingLight = new Vector3(alpha*normal.x - toLight.x, alpha*normal.y - toLight.y, alpha*normal.z - toLight.z)
                
        const alignment = to_eye.dotProduct(outgoingLight)
       
        
        var s = alignment/ (Math.sqrt(to_eye.dotProduct(to_eye)) * Math.sqrt(outgoingLight.dotProduct(outgoingLight)))
        
        if (s < 0) {
            s = 0
        }
        
        s = Math.pow(s,specularity_power)
        
        const final_spec = new Vector3([s*255,s*255,s*255])
        
        return final_spec
    }
}

class Ray {
    constructor(start, dir) {
        this.start = start; //A x0,y0,z0
        this.dir = dir; //A + this.dir = B
        
        // b = x1,y1,z1
        // P = start + t*dir
    }


    tToPt(t) {
        const ret = new Vector3(this.start).increaseByMultiple(this.dir, t);
        return ret;
    }
    
    allHits(geometries) {
        let ret = [];
        for (const g of geometries) {
            const record = this.hit(g);
            if (record.length === undefined) {
                console.error("Return type of hit() should be an array.");
            }
            ret = ret.concat(record);
        }
        return ret;
    }
    
    hit(g) {
        if (g.s_type === 'sphere') {
            return this.hitSphere(g);
        }
        else if (g.s_type === 'sheet') {
            return this.hitSheet(g);
        }
        else if (g.s_type === 'box') {
            return this.hitBox(g);
        }
        else {
            console.error("Shape of type " + g.s_type + " is not supported");
        }
    }
    
    hitSheet(g) {
        /*
        Compute the intersection between the ray (this) and the given geometry g, a sheet.
        Return an instance of the HitRecord class.
        */
        // aliases for shorter typing
        const pt0 = g.v3_pt0;
        const pt1 = g.v3_pt1;
        const pt2 = g.v3_pt2;
        // compute d, normal, edge1, edge2 once only, to save time
        if (g.edge1 === undefined) {
            g.edge1 = vectorDifference(pt0, pt1);
            g.edge2 = vectorDifference(pt2, pt1);

            // edge1 and edge2 assumed to be orthogonal
            const unit1 = vectorDifference(pt0, pt1).normalize();
            const unit2 = vectorDifference(pt2, pt1).normalize();
            if (Math.abs(unit1.dotProduct(unit2)) > 0.01) {
                console.error(`Edges ${edge1} and ${edge2} are not orthogonal`);
            }

            // assume pts listed in ccw order, e.g. [1, 0, 0], [0,0,0], [0, 1, 0]
            g.normal = unit2.crossProduct(unit1);
            g.normal.normalize();

            // ray-plane intersection
            g.d = g.normal.dotProduct(pt1);
        }
        const t = (g.d - g.normal.dotProduct(this.start))/g.normal.dotProduct(this.dir);
        const pt = this.tToPt(t);
        // check if pt is within sheet
        let alpha = vectorDifference(pt,pt1).dotProduct(g.edge1);
        alpha /= g.edge1.dotProduct(g.edge1);
        let beta = vectorDifference(pt,pt1).dotProduct(g.edge2);
        beta /= g.edge2.dotProduct(g.edge2);

        if (alpha < 0 || alpha > 1 || beta < 0 || beta > 1) {
            // hit doesn't count
            return [];
        }
        
        const hit = new HitRecord(this, t, pt, g, g.normal)
        return [hit];
    }

    hitSphere(g) {
        /*
        Compute the intersection between the ray (this) and the given geometry g, a sphere.
        Return an instance of the HitRecord class.
        */
        // TODO
        const r = g.f_radius        //sphere radius
//        const CO = new Vector3(vectorDifference(this.start, g.v3_center))  //distance b/w start point of ray and circle center
//        console.log("CO", CO)
//        
//        const a = this.dir.dotProduct(this.dir)       //<D,D>
//        console.log("a", a)
//        const b = 2*(CO.dotProduct(this.dir))           // s<CO,D>
//        console.log("b", b)
//        const c = CO.dotProduct(CO) - (r*r)    
//        console.log("c", c)
        
        const u = vectorDifference(this.start, g.v3_center)         //A-q , start - spheres center
        const v = this.dir          //B-A
        const a = v.dotProduct(v)           //<v,v>
        const b = 2* (u.dotProduct(v))
        const c = u.dotProduct(u) - (r*r)
 
        
        const discriminant = (b*b) - (4*a*c)
        if (discriminant < 0) {
            const t = (-b + Math.sqrt(discriminant)) / (2*a)
            const pt = this.tToPt(t)
            const pt_normal = vectorDifference(pt, g.v3_center).normalize()
            
            return []
        }
        

        
        //interesections
        const t1 = (-b + Math.sqrt(discriminant)) / (2*a)
        const t2 = (-b - Math.sqrt(discriminant)) / (2*a)
        
        
        //points where ray hit at t1 and t2
        const pt1 = this.tToPt(t1);
        const pt2 = this.tToPt(t2);
        

        //normals of circle are vector b/w pt - center of circle
        const pt1_normal = vectorDifference(pt1, g.v3_center).normalize()
        const pt2_normal = vectorDifference(pt2, g.v3_center).normalize()

        
        const hit1 = new HitRecord(this, t1, pt1, g, pt1_normal)
        const hit2 = new HitRecord(this, t2, pt2, g, pt2_normal)
      
    
        //return instance of hit record class
        if (t1 < t2) {
            return [hit1, hit2]
        }
        else {
            return [hit2, hit1]
        }
        
        
        }

    hitBox(g) {
        /*
        Compute the intersection between the ray (this) and the given geometry g, a box.
        Return an instance of the HitRecord class.
        */
        // TODO
    }
}

class HitRecord {
    constructor(ray, t, pt, struckGeometry, normal) {
        this.ray = ray; // ray that was involved
        this.t = t; // t-value of intersection along ray
        this.pt = pt; // vector3, point where the ray hit
        this.struckGeometry = struckGeometry; // object that was hit
        this.normal = normal; // normal vector of struckGeometry at pt
    }
}