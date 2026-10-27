import { extendTheme } from "@chakra-ui/react";

// Design tokens: parade-ground green, uniform khaki, hostel-sign condensed type, concrete-grey paper.
export const C = { forest: "#0f3d2a", green: "#1b7a4b", khaki: "#c9b46a", paper: "#e8ece7", ink: "#14201a", line: "#c9d2ca", amber: "#d89b00", red: "#b3362b", blue: "#2f6f9f" };

export const theme = extendTheme({
  fonts: { heading: "'Barlow Condensed', 'Arial Narrow', sans-serif", body: "'Barlow', system-ui, sans-serif" },
  radii: { sm: "3px", md: "4px", lg: "6px" },
  colors: { brand: { 50: "#e7f3ec", 100: "#c8e3d3", 200: "#9ccdb2", 300: "#6db38f", 400: "#3f9a6e", 500: C.green, 600: "#156238", 700: "#0f4d2c", 800: C.forest, 900: "#08261a" }, khaki: { 100: "#f2ecd3", 300: C.khaki, 500: "#a08a3c" } },
  styles: { global: { body: { bg: C.paper, color: C.ink, fontSize: "16px" }, "*:focus-visible": { outline: `2px solid ${C.green}`, outlineOffset: "2px" }, "@media print": { ".no-print": { display: "none !important" }, body: { bg: "white" }, "@page": { margin: "12mm" } } } },
  components: {
    Heading: { baseStyle: { fontWeight: 700, letterSpacing: "0.005em" } },
    Button: { baseStyle: { fontWeight: 600, borderRadius: "4px" }, defaultProps: { colorScheme: "brand" }, variants: { solid: { bg: "brand.500", color: "white", _hover: { bg: "brand.600", _disabled: { bg: "brand.500" } } } } },
    Input: { defaultProps: { focusBorderColor: "brand.500" } }, Select: { defaultProps: { focusBorderColor: "brand.500" } }, Textarea: { defaultProps: { focusBorderColor: "brand.500" } },
    FormLabel: { baseStyle: { fontWeight: 600, fontSize: "sm", mb: 1 } },
  },
});
