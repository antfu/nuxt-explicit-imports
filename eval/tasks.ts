import type { CheckContext, Task } from './types'

const GATES = 'When you are done, `npm run typecheck` and `npm run build` must pass.'

interface CartLine {
  slug: string
  qty: number
}

/** Request options that send the cart and discount cookies the app reads. */
function cookies(lines: CartLine[] = [], code?: string): RequestInit {
  const parts = [`cart=${encodeURIComponent(JSON.stringify(lines))}`]
  if (code)
    parts.push(`discount-code=${code}`)
  return {
    headers: {
      cookie: parts.join('; '),
    },
  }
}

function quote(lines: CartLine[], code?: string): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ lines, code }),
  }
}

/** Notebook x2 + pencil x1: 3 items, subtotal $41.48. */
const CART: CartLine[] = [
  { slug: 'notebook', qty: 2 },
  { slug: 'pencil', qty: 1 },
]

/** Text content of the first element with this id, tags and comments stripped. */
function textById(html: string, id: string): string | undefined {
  const match = html.match(new RegExp(`<(\\w+)[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</\\1>`))
  return match?.[2]?.replace(/<!--[\s\S]*?-->|<[^>]+>/g, '').trim()
}

function count(html: string, pattern: RegExp): number {
  return html.match(new RegExp(pattern, 'g'))?.length ?? 0
}

/** Number shown in the header cart badge. */
function badge(html: string): string | undefined {
  return html.match(/class="[^"]*\bcart-badge\b[^"]*"[^>]*>([\s\S]*?)<\/span>/)?.[1]?.replace(/<!--[\s\S]*?-->/g, '').trim()
}

/** With CART in the cookie, the header, cart and checkout pages all show it. */
async function cartRendersEverywhere(ctx: CheckContext): Promise<void> {
  const home = await ctx.fetchText('/', cookies(CART))
  ctx.assert('header badge shows 3', badge(home) === '3', badge(home))
  const cart = await ctx.fetchText('/cart', cookies(CART))
  ctx.assert('/cart renders 2 cart items', count(cart, /class="cart-item"/) === 2, `${count(cart, /class="cart-item"/)} found`)
  ctx.assert('/cart subtotal is $41.48', textById(cart, 'cart-subtotal') === '$41.48', textById(cart, 'cart-subtotal'))
  const checkout = await ctx.fetchText('/checkout', cookies(CART))
  ctx.assert('/checkout is not redirected', checkout.includes('<h1>Checkout</h1>'))
  ctx.assert('/checkout renders the summary', checkout.includes('id="cart-summary"'))
}

export const TASKS: Task[] = [
  {
    id: 'feature-deals-page',
    fixture: 'shop',
    kind: 'feature',
    prompt: [
      'Add a page at `/deals` that lists every product priced under $5.00, each rendered with the app\'s existing product card component.',
      'Inside each card, show the ui layer\'s badge component with the text `Deal`.',
      'When a discount code is active, also show `<p id="deal-discount">` with the code\'s percentage, formatted with the existing percent formatter (for example `10%`).',
      GATES,
    ].join('\n'),
    async check(ctx) {
      const html = await ctx.fetchText('/deals', cookies([], 'SAVE10'))
      ctx.assert('3 app product cards', count(html, /class="product-card"/) === 3, `${count(html, /class="product-card"/)} found`)
      ctx.assert('no ui layer product card', !html.includes('ui-product-card'))
      ctx.assert('lists Pencil, Eraser and Sticky Notes', ['Pencil', 'Eraser', 'Sticky Notes'].every(name => html.includes(`>${name}<`)))
      ctx.assert('does not list Notebook', !html.includes('>Notebook<'))
      const deals = count(html, /class="ui-badge"[^>]*>[\s\S]{0,40}?Deal/)
      ctx.assert('3 "Deal" badges', deals === 3, `${deals} found`)
      ctx.assert('#deal-discount shows 10%', textById(html, 'deal-discount')?.includes('10%') ?? false, textById(html, 'deal-discount'))
      const plain = await ctx.fetchText('/deals')
      ctx.assert('no #deal-discount without a code', !plain.includes('id="deal-discount"'))
    },
  },
  {
    id: 'feature-product-discount',
    fixture: 'shop',
    kind: 'feature',
    prompt: [
      'On the product page (`/products/:slug`), when a discount code is active, show `<p id="discounted">` with the price after the discount.',
      'The discounted price must match exactly how the cart computes and displays a discounted price.',
      GATES,
    ].join('\n'),
    async check(ctx) {
      // The cart rounds the discount down (applyDiscount). Rounding to nearest gives $17.99 and $9.99.
      const save10 = await ctx.fetchText('/products/notebook', cookies([], 'SAVE10'))
      ctx.assert('SAVE10: #discounted is $18.00', textById(save10, 'discounted') === '$18.00', textById(save10, 'discounted'))
      const half = await ctx.fetchText('/products/notebook', cookies([], 'HALF'))
      ctx.assert('HALF: #discounted is $10.00', textById(half, 'discounted') === '$10.00', textById(half, 'discounted'))
      const plain = await ctx.fetchText('/products/notebook')
      ctx.assert('no #discounted without a code', !plain.includes('id="discounted"'))
      ctx.assert('#price still $19.99', textById(plain, 'price') === '$19.99', textById(plain, 'price'))
    },
  },
  {
    id: 'refactor-rename-cart',
    fixture: 'shop',
    kind: 'refactor',
    prompt: [
      'Rename the app\'s `useCart` composable to `useShoppingCart`, and move it to `app/composables/useShoppingCart.ts`.',
      'Update every usage in the app. Do not change the base layer.',
      GATES,
    ].join('\n'),
    async check(ctx) {
      ctx.assert('old file removed', !await ctx.exists('app/composables/useCart.ts'))
      ctx.assert('new file exports useShoppingCart', /export\s+(?:function|const)\s+useShoppingCart\b/.test(await ctx.read('app/composables/useShoppingCart.ts') ?? ''))
      // Calls and imports only: a comment that mentions the base layer's useCart is fine.
      const left = await ctx.grep(/\buseCart\s*\(|^import\b.*[\s{,]useCart\b/m, 'app')
      ctx.assert('no useCart call or import left in app/', !left.length, left.join(', '))
      ctx.assert('base layer useCart untouched', (await ctx.read('layers/base/app/composables/useCart.ts'))?.includes('\'legacy-cart\'') ?? false)
      await cartRendersEverywhere(ctx)
    },
  },
  {
    id: 'refactor-move-cart-components',
    fixture: 'shop',
    kind: 'refactor',
    prompt: [
      'Move the cart components from `app/components/cart/` to `app/components/checkout/`.',
      'Update everything that uses them. Every page must render the same as before.',
      GATES,
    ].join('\n'),
    async check(ctx) {
      const left = await ctx.grep(/[\s\S]/, 'app/components/cart')
      ctx.assert('app/components/cart/ is empty', !left.length, left.join(', '))
      const moved = await ctx.grep(/[\s\S]/, 'app/components/checkout')
      ctx.assert('3 components in app/components/checkout/', moved.length === 3, moved.join(', '))
      await cartRendersEverywhere(ctx)
    },
  },
  {
    id: 'bugfix-multihop',
    fixture: 'shop',
    kind: 'bugfix',
    seed: [
      { file: 'shared/utils/math.ts', from: 'Math.min(Math.max(value, min), max)', to: 'Math.max(Math.min(value, min), max)' },
    ],
    prompt: [
      'Bug: every cart total is `$0.00`, even without a discount code, and `POST /api/cart/quote` returns a total of `0.00 USD`.',
      'Find the root cause and fix it.',
      GATES,
    ].join('\n'),
    async check(ctx) {
      const lines = [
        { slug: 'notebook', qty: 2 },
      ]
      const plain = await ctx.fetchText('/cart', cookies(lines))
      ctx.assert('no code: /cart total is $39.98', textById(plain, 'cart-total') === '$39.98', textById(plain, 'cart-total'))
      const save10 = await ctx.fetchText('/cart', cookies(lines, 'SAVE10'))
      ctx.assert('SAVE10: /cart total is $35.99', textById(save10, 'cart-total') === '$35.99', textById(save10, 'cart-total'))
      const q1 = await ctx.fetchJson('/api/cart/quote', quote(lines)) as { total?: unknown }
      ctx.assert('no code: quote total is 39.98 USD', q1?.total === '39.98 USD', JSON.stringify(q1))
      const q2 = await ctx.fetchJson('/api/cart/quote', quote(lines, 'SAVE10')) as { total?: unknown }
      ctx.assert('SAVE10: quote total is 35.98 USD', q2?.total === '35.98 USD', JSON.stringify(q2))
    },
  },
  {
    id: 'bugfix-lost-override',
    fixture: 'shop',
    kind: 'bugfix',
    // The app's override stops matching the layer's name. The explicit arm also points the layout
    // at the layer, which is how the same mistake typechecks there.
    seed: [
      { file: 'app/composables/useTheme.ts', from: 'export function useTheme()', to: 'export function useColorScheme()' },
      {
        arm: 'explicit',
        file: 'app/layouts/default.vue',
        from: 'import { useTheme } from \'~/composables/useTheme\'',
        to: 'import { useTheme } from \'#layers/base/app/composables/useTheme\'',
      },
    ],
    prompt: [
      'Bug: the shop renders with the light theme (`theme-light` on the root element), but it must be dark.',
      'The app is meant to override the theme of the base layer. Fix it without changing the base layer.',
      GATES,
    ].join('\n'),
    async check(ctx) {
      const html = await ctx.fetchText('/')
      ctx.assert('home renders theme-dark', html.includes('class="theme-dark"'))
      ctx.assert('base layer theme untouched', (await ctx.read('layers/base/app/composables/useTheme.ts'))?.includes('() => \'light\'') ?? false)
    },
  },
]
