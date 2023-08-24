import * as sinon from "sinon";

export class FakeClock {

    private clock;

    public set(date: string | number | Date = new Date()) {
        this.initClock();
        this.clock.setSystemTime(new Date(date));
    }

    public advance(seconds: number) {
        this.initClock();
        this.clock.setSystemTime(Date.now() + seconds * 1000);
    }

    public getTime() {
        return Date.now();
    }

    public restore() {
        this.clock && this.clock.restore();
        delete this.clock;
    }

    private initClock() {
        if (!this.clock) {
            this.clock = sinon.useFakeTimers({
                now: new Date(),
                shouldAdvanceTime: true,
                toFake: ["Date"],
            });
        }
    }

}
export const fakeClock = new FakeClock();