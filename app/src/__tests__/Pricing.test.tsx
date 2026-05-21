import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Pricing from '../sections/Pricing'

describe('Pricing section', () => {
  it('renders the section heading', () => {
    render(<Pricing />)
    expect(screen.getByText(/pricing/i)).toBeTruthy()
  })
})
