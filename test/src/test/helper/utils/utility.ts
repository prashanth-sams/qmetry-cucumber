
export default class Utility {

    static getIndices(loop: number): number[] {
        return Array.from({ length: loop }, (_, i) => i);
    }
}