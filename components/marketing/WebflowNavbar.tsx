import Link from 'next/link'
import Image from 'next/image'

export function WebflowNavbar() {
  return (
    <div className="nav">
      <div
        data-duration="400"
        data-animation="default"
        data-easing2="ease"
        data-easing="ease"
        data-collapse="medium"
        role="banner"
        data-no-scroll="1"
        className="nav_container w-nav"
      >
        <div className="nav_left">
          <Link href="/" className="nav_logo w-inline-block">
            <div className="nav_logo-icon h-[120px] flex items-center">
              <Image
                src="/tsmart_cleaning_512_transparent.png"
                alt="tsmart cleaning logo"
                width={200}
                height={200}
                className="nav_main_logo"
              />
            </div>
          </Link>
          <nav role="navigation" className="nav_menu w-nav-menu">
            <ul role="list" className="nav_menu-list w-list-unstyled">
              <li className="nav_menu-list-item">
                <div
                  data-delay="0"
                  data-hover="false"
                  className="nav_dropdown-menu w-dropdown"
                >
                  <div className="nav_link w-dropdown-toggle">
                    <div>Services</div>
                    <div className="nav-caret w-icon-dropdown-toggle"></div>
                  </div>
                  <nav className="mega-nav_dropdown-list w-dropdown-list">
                    <div className="mega-nav_dropdown-list-wrapper">
                      <ul
                        role="list"
                        className="grid_3-col tablet-1-col gap-medium margin-bottom_none w-list-unstyled"
                      >
                        <li className="w-node-_6bf376c4-1e42-910f-80c5-33de7f0d8667-7f0d8653">
                          <div className="w-layout-grid grid_3-col tablet-1-col gap-small">
                            <div>
                              <div className="eyebrow">Customers</div>
                              <ul role="list" className="mega-nav_list w-list-unstyled">
                                <li className="margin-bottom_none">
                                  <Link
                                    href="/customer/book"
                                    className="mega-nav_link-item w-inline-block"
                                  >
                                    <div className="icon is-medium">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 32 32"
                                        fill="currentColor"
                                      >
                                        <path
                                          d="m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                          strokeLinejoin="round"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="w-node-_6bf376c4-1e42-910f-80c5-33de7f0d8672-7f0d8653">
                                      <div>
                                        <strong>Book Now</strong>
                                      </div>
                                      <div className="paragraph_small text-color_secondary">
                                        Quick online booking
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                                <li className="margin-bottom_none">
                                  <Link
                                    href="/find-cleaners"
                                    className="mega-nav_link-item w-inline-block"
                                  >
                                    <div className="icon is-medium">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 32 32"
                                        fill="currentColor"
                                      >
                                        <path
                                          d="m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                          strokeLinejoin="round"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="w-node-_6bf376c4-1e42-910f-80c5-33de7f0d867d-7f0d8653">
                                      <div>
                                        <strong>Find Cleaners</strong>
                                      </div>
                                      <div className="paragraph_small text-color_secondary">
                                        Browse professionals
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                                <li className="margin-bottom_none">
                                  <Link
                                    href="#pricing"
                                    className="mega-nav_link-item w-inline-block"
                                  >
                                    <div className="icon is-medium">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 32 32"
                                        fill="currentColor"
                                      >
                                        <path
                                          d="m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                          strokeLinejoin="round"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="w-node-_6bf376c4-1e42-910f-80c5-33de7f0d8688-7f0d8653">
                                      <div>
                                        <strong>Pricing</strong>
                                      </div>
                                      <div className="paragraph_small text-color_secondary">
                                        View plans
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                              </ul>
                            </div>
                            <div>
                              <div className="eyebrow">Providers</div>
                              <ul role="list" className="mega-nav_list w-list-unstyled">
                                <li className="margin-bottom_none">
                                  <Link
                                    href="/provider-signup"
                                    className="mega-nav_link-item w-inline-block"
                                  >
                                    <div className="icon is-medium">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 32 32"
                                        fill="currentColor"
                                      >
                                        <path
                                          d="m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                          strokeLinejoin="round"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="w-node-_6bf376c4-1e42-910f-80c5-33de7f0d8697-7f0d8653">
                                      <div>
                                        <strong>Join Providers</strong>
                                      </div>
                                      <div className="paragraph_small text-color_secondary">
                                        Sign up to offer services
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                                <li className="margin-bottom_none">
                                  <Link
                                    href="/provider"
                                    className="mega-nav_link-item w-inline-block"
                                  >
                                    <div className="icon is-medium">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 32 32"
                                        fill="currentColor"
                                      >
                                        <path
                                          d="m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                          strokeLinejoin="round"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="w-node-_6bf376c4-1e42-910f-80c5-33de7f0d86a2-7f0d8653">
                                      <div>
                                        <strong>Dashboard</strong>
                                      </div>
                                      <div className="paragraph_small text-color_secondary">
                                        Manage jobs
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                                <li className="margin-bottom_none">
                                  <Link
                                    href="/contact"
                                    className="mega-nav_link-item w-inline-block"
                                  >
                                    <div className="icon is-medium">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 32 32"
                                        fill="currentColor"
                                      >
                                        <path
                                          d="m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                          strokeLinejoin="round"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="w-node-_6bf376c4-1e42-910f-80c5-33de7f0d86ad-7f0d8653">
                                      <div>
                                        <strong>Support</strong>
                                      </div>
                                      <div className="paragraph_small text-color_secondary">
                                        Help &amp; resources
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                              </ul>
                            </div>
                            <div>
                              <div className="eyebrow">Business</div>
                              <ul role="list" className="mega-nav_list w-list-unstyled">
                                <li className="margin-bottom_none">
                                  <Link
                                    href="/company"
                                    className="mega-nav_link-item w-inline-block"
                                  >
                                    <div className="icon is-medium">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 32 32"
                                        fill="currentColor"
                                      >
                                        <path
                                          d="m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                          strokeLinejoin="round"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="w-node-_6bf376c4-1e42-910f-80c5-33de7f0d86be-7f0d8653">
                                      <div>
                                        <strong>Enterprise</strong>
                                      </div>
                                      <div className="paragraph_small text-color_secondary">
                                        Team solutions
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                                <li className="margin-bottom_none">
                                  <Link
                                    href="/tsmartcard"
                                    className="mega-nav_link-item w-inline-block"
                                  >
                                    <div className="icon is-medium">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 32 32"
                                        fill="currentColor"
                                      >
                                        <path
                                          d="m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                          strokeLinejoin="round"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="w-node-_6bf376c4-1e42-910f-80c5-33de7f0d86c9-7f0d8653">
                                      <div>
                                        <strong>tSmartCard</strong>
                                      </div>
                                      <div className="paragraph_small text-color_secondary">
                                        Member perks
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                                <li className="margin-bottom_none">
                                  <Link
                                    href="/insurance"
                                    className="mega-nav_link-item w-inline-block"
                                  >
                                    <div className="icon is-medium">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 32 32"
                                        fill="currentColor"
                                      >
                                        <path
                                          d="m25.7 9.3l-7-7A.9.9 0 0 0 18 2H8a2.006 2.006 0 0 0-2 2v24a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V10a.9.9 0 0 0-.3-.7M18 4.4l5.6 5.6H18ZM24 28H8V4h8v6a2.006 2.006 0 0 0 2 2h6Z"
                                          strokeLinejoin="round"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="w-node-_6bf376c4-1e42-910f-80c5-33de7f0d86d4-7f0d8653">
                                      <div>
                                        <strong>Insurance</strong>
                                      </div>
                                      <div className="paragraph_small text-color_secondary">
                                        Booking protection
                                      </div>
                                    </div>
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </li>
                        <li className="flex_horizontal w-node-_6bf376c4-1e42-910f-80c5-33de7f0d86da-7f0d8653">
                          <Link
                            href="/insurance"
                            className="card-link is-inverse flex-child_expand w-inline-block"
                          >
                            <div className="card_body">
                              <div className="heading_h3">Get coverage for your bookings</div>
                              <p className="paragraph_small text-color_inverse-secondary">
                                Compare plans and choose your coverage.
                              </p>
                              <div className="margin_top-auto">
                                <div className="button-group">
                                  <div className="text-button is-secondary">
                                    <div>Compare</div>
                                    <div className="button_icon">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                      >
                                        <path
                                          d="M2 8H14.5M14.5 8L8.5 2M14.5 8L8.5 14"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinejoin="round"
                                        ></path>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </nav>
                </div>
              </li>
              <li className="nav_menu-list-item">
                <Link href="/about" className="nav_link w-inline-block">
                  <div>About</div>
                </Link>
              </li>
              <li className="nav_menu-list-item">
                <Link href="#" className="nav_link w-inline-block">
                  <div>Blog</div>
                </Link>
              </li>
              <li className="nav_menu-list-item">
                <div
                  data-delay="0"
                  data-hover="false"
                  className="nav_dropdown-menu w-dropdown"
                >
                  <div className="nav_link w-dropdown-toggle">
                    <div>Support</div>
                    <div className="nav-caret w-icon-dropdown-toggle"></div>
                  </div>
                  <div className="nav_dropdown-list w-dropdown-list">
                    <div className="nav-menu_dropdown-list-wrapper">
                      <ul
                        role="list"
                        className="flex_vertical margin-bottom_none w-list-unstyled"
                      >
                        <li className="margin-bottom_none">
                          <Link
                            href="/contact"
                            className="nav_dropdown-link w-inline-block"
                          >
                            <div className="button_label">Help Center</div>
                          </Link>
                        </li>
                        <li className="margin-bottom_none">
                          <Link
                            href="/contact"
                            className="nav_dropdown-link w-inline-block"
                          >
                            <div className="button_label">Contact</div>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
        <div className="nav_right">
          <div className="button-group margin-top_none">
            <Link href="/customer/book" className="button w-inline-block">
              <div className="button_label">Book now</div>
            </Link>
          </div>
        </div>
        <div className="nav_mobile-menu-button w-nav-button">
          <div className="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <g
                className="nc-icon-wrapper"
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth="1.5"
                fill="none"
                stroke="currentColor"
                strokeMiterlimit="10"
              >
                <line x1="1" y1="12" x2="23" y2="12" stroke="currentColor"></line>
                <line x1="1" y1="5" x2="23" y2="5"></line>
                <line x1="1" y1="19" x2="23" y2="19"></line>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

