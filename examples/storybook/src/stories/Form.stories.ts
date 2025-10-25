import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "./Form";

const meta = {
  title: "Example/Form",
  component: Form,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    showSuccess: { control: "boolean" },
  },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Contact Form",
    showSuccess: false,
  },
};

// ============= Form Interaction Examples =============

export const FilledForm: Story = {
  args: {
    title: "Filled Form",
    showSuccess: false,
  },
  parameters: {
    visualTesting: {
      interactions: [
        {
          type: "fill",
          selector: 'input[name="email"]',
          text: "test@example.com",
        },
        {
          type: "fill",
          selector: 'input[name="password"]',
          text: "password123",
        },
        { type: "select", selector: 'select[name="country"]', value: "us" },
        { type: "check", selector: 'input[type="checkbox"]' },
      ],
    },
  },
};

export const SubmittedForm: Story = {
  args: {
    title: "Submitted Form",
    showSuccess: true,
  },
  parameters: {
    visualTesting: {
      interactions: [
        {
          type: "fill",
          selector: 'input[name="email"]',
          text: "test@example.com",
        },
        {
          type: "fill",
          selector: 'input[name="password"]',
          text: "password123",
        },
        { type: "select", selector: 'select[name="country"]', value: "us" },
        { type: "check", selector: 'input[type="checkbox"]' },
        { type: "click", selector: 'button[type="submit"]' },
        {
          type: "wait",
          selector: ".form-success",
          options: { state: "visible" },
        },
      ],
    },
  },
};

export const FormWithTyping: Story = {
  args: {
    title: "Form with Typing",
  },
  parameters: {
    visualTesting: {
      interactions: [
        { type: "focus", selector: 'input[name="email"]' },
        {
          type: "type",
          selector: 'input[name="email"]',
          text: "user@domain.com",
          options: { delay: 50 },
        },
        { type: "press", selector: 'input[name="email"]', key: "Tab" },
        {
          type: "type",
          selector: 'input[name="password"]',
          text: "mypassword",
          options: { delay: 30 },
        },
      ],
    },
  },
};

export const FormWithClearAndRefill: Story = {
  args: {
    title: "Clear and Refill",
  },
  parameters: {
    visualTesting: {
      interactions: [
        {
          type: "fill",
          selector: 'input[name="email"]',
          text: "wrong@email.com",
        },
        { type: "clear", selector: 'input[name="email"]' },
        {
          type: "fill",
          selector: 'input[name="email"]',
          text: "correct@email.com",
        },
        {
          type: "selectOption",
          selector: 'select[name="country"]',
          values: [{ label: "Canada" }],
        },
      ],
    },
  },
};

// Test story to verify interactions are working
export const InteractionTest: Story = {
  args: {
    title: "Interaction Test - Should Show Filled Form",
  },
  parameters: {
    visualTesting: {
      interactions: [
        {
          type: "fill",
          selector: 'input[name="email"]',
          text: "interaction-test@example.com",
        },
        {
          type: "fill",
          selector: 'input[name="password"]',
          text: "testpassword123",
        },
        { type: "select", selector: 'select[name="country"]', value: "uk" },
        { type: "check", selector: 'input[type="checkbox"]' },
      ],
    },
  },
};
