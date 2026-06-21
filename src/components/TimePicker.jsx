import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

export function TimePicker({ value, onChange, placeholder = "Select time", required }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // value is expected in "HH:mm" (24-hour format)
  // We convert to 12-hour for display
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("AM");

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      let hInt = parseInt(h, 10);
      const isPm = hInt >= 12;
      if (hInt === 0) hInt = 12;
      else if (hInt > 12) hInt -= 12;
      
      setHour(hInt.toString().padStart(2, "0"));
      setMinute(m || "00");
      setAmpm(isPm ? "PM" : "AM");
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApply = (h, m, ap) => {
    let hInt = parseInt(h, 10);
    if (ap === "PM" && hInt < 12) hInt += 12;
    if (ap === "AM" && hInt === 12) hInt = 0;
    const finalValue = `${hInt.toString().padStart(2, "0")}:${m}`;
    onChange(finalValue);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  const displayValue = value ? `${hour}:${minute} ${ampm}` : "";

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 bg-background border rounded-md py-2 px-3 text-sm text-left transition-all cursor-pointer ${
          open ? "border-primary ring-1 ring-primary/30" : "border-input hover:border-primary/50"
        }`}
      >
        <span className={displayValue ? "text-foreground" : "text-muted-foreground"}>
          {displayValue || placeholder}
        </span>
        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {/* Hidden input for HTML validation if required */}
      <input type="hidden" value={value || ""} required={required} onChange={() => {}} />

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 p-3">
          <div className="flex justify-between gap-2">
            
            {/* Hours */}
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground text-center uppercase">Hour</span>
              <div className="h-32 overflow-y-auto border rounded-md bg-background no-scrollbar flex flex-col p-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => { setHour(h); handleApply(h, minute, ampm); }}
                    className={`py-1 px-2 text-xs text-center rounded-sm transition-colors ${
                      hour === h ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground text-center uppercase">Min</span>
              <div className="h-32 overflow-y-auto border rounded-md bg-background no-scrollbar flex flex-col p-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMinute(m); handleApply(hour, m, ampm); }}
                    className={`py-1 px-2 text-xs text-center rounded-sm transition-colors ${
                      minute === m ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM */}
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground text-center uppercase">AM/PM</span>
              <div className="h-32 flex flex-col border rounded-md bg-background p-1 gap-1">
                {["AM", "PM"].map((ap) => (
                  <button
                    key={ap}
                    type="button"
                    onClick={() => { setAmpm(ap); handleApply(hour, minute, ap); }}
                    className={`flex-1 flex items-center justify-center text-xs rounded-sm transition-colors ${
                      ampm === ap ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"
                    }`}
                  >
                    {ap}
                  </button>
                ))}
              </div>
            </div>

          </div>
          
          <div className="mt-3 pt-3 border-t flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-md font-bold hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
