import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "./Button";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Example/Button",
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    backgroundColor: { control: "color" },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    primary: true,
    label: "Button",
  },
};

export const Secondary: Story = {
  args: {
    label: "Button",
  },
  parameters: {
    visualTesting: {
      skip: true,
    },
  },
};

export const Large: Story = {
  args: {
    size: "large",
    label: "Button",
  },
};

export const Small: Story = {
  args: {
    size: "small",
    label: "Button",
  },
};

// ============= Interaction Examples =============

export const HoverState: Story = {
  args: {
    primary: true,
    label: "Hover Me",
  },
  parameters: {
    visualTesting: {
      interactions: [{ type: "hover", selector: ".storybook-button" }],
    },
  },
};

export const ClickedState: Story = {
  args: {
    label: "Click Me",
  },
  parameters: {
    visualTesting: {
      interactions: [
        { type: "click", selector: ".storybook-button" },
        { type: "waitForTimeout", duration: 300 },
      ],
    },
  },
};

export const DoubleClickWithModifiers: Story = {
  args: {
    primary: true,
    label: "Double Click Me",
  },
  parameters: {
    visualTesting: {
      interactions: [
        {
          type: "dblclick",
          selector: ".storybook-button",
          options: {
            modifiers: ["Shift"],
          },
        },
      ],
    },
  },
};

export const FocusState: Story = {
  args: {
    label: "Focus Me",
  },
  parameters: {
    visualTesting: {
      interactions: [{ type: "focus", selector: ".storybook-button" }],
    },
  },
};
