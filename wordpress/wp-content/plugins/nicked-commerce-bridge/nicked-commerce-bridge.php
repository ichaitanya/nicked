<?php
/**
 * Plugin Name: NICKED Commerce Bridge
 * Description: NICKED catalogue fields, owner dashboard, safe product archive, draft seeder, and private order tracking for the React storefront.
 * Version: 0.1.0
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Requires Plugins: woocommerce
 * Author: NICKED Store Team
 * License: GPL-2.0-or-later
 * Text Domain: nicked-commerce-bridge
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'NICKED_BRIDGE_VERSION', '0.1.0' );
define( 'NICKED_BRIDGE_FILE', __FILE__ );

add_action( 'plugins_loaded', 'nicked_bridge_boot' );

function nicked_bridge_boot(): void {
	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', 'nicked_bridge_woocommerce_notice' );
		return;
	}

	add_action( 'init', 'nicked_register_product_meta' );
	add_action( 'add_meta_boxes_product', 'nicked_add_product_editor_box' );
	add_action( 'save_post_product', 'nicked_save_product_editor_fields', 10, 2 );
	add_action( 'admin_menu', 'nicked_add_admin_menu' );
	add_action( 'wp_dashboard_setup', 'nicked_add_dashboard_widget' );
	add_action( 'admin_init', 'nicked_register_settings' );
	add_action( 'rest_api_init', 'nicked_register_rest_routes' );
	add_action( 'admin_post_nicked_seed_catalogue', 'nicked_handle_seed_catalogue' );
	add_filter( 'post_row_actions', 'nicked_add_archive_row_action', 10, 2 );
	add_filter( 'bulk_actions-edit-product', 'nicked_add_archive_bulk_action' );
	add_filter( 'handle_bulk_actions-edit-product', 'nicked_handle_archive_bulk_action', 10, 3 );
	add_filter( 'pre_trash_post', 'nicked_archive_ordered_product_before_trash', 10, 3 );
	add_filter( 'pre_delete_post', 'nicked_archive_ordered_product_before_delete', 10, 3 );
	add_action( 'add_meta_boxes_shop_order', 'nicked_add_tracking_metabox' );
	add_action( 'add_meta_boxes_woocommerce_page_wc-orders', 'nicked_add_tracking_metabox' );
	add_action( 'save_post_shop_order', 'nicked_save_tracking_fields', 10, 2 );
	add_action( 'woocommerce_process_shop_order_meta', 'nicked_save_tracking_fields', 10, 1 );
	add_action( 'rest_api_init', 'nicked_add_rest_headers', 100 );
	add_action( 'woocommerce_blocks_loaded', 'nicked_register_checkout_consent_extension' );
	add_action( 'woocommerce_store_api_checkout_update_order_from_request', 'nicked_validate_checkout_consent', 1, 2 );
}

function nicked_bridge_woocommerce_notice(): void {
	if ( current_user_can( 'activate_plugins' ) ) {
		echo '<div class="notice notice-warning"><p><strong>NICKED Commerce Bridge</strong> needs WooCommerce to be active before its product and order tools can run.</p></div>';
	}
}

function nicked_register_product_meta(): void {
	$public_meta = array(
		'nicked_size'       => 'sanitize_text_field',
		'nicked_range'      => 'sanitize_text_field',
		'nicked_concern'    => 'sanitize_text_field',
		'nicked_tagline'    => 'sanitize_text_field',
		'nicked_key_points' => 'nicked_sanitize_lines',
		'nicked_ideal_for'  => 'sanitize_textarea_field',
		'nicked_how_to_use' => 'sanitize_textarea_field',
		'nicked_ingredients'=> 'sanitize_textarea_field',
		'nicked_public_summary' => 'sanitize_textarea_field',
	);
	foreach ( $public_meta as $key => $sanitize_callback ) {
		register_post_meta(
			'product',
			$key,
			array(
				'type'              => 'string',
				'single'            => true,
				'show_in_rest'      => false,
				'sanitize_callback' => $sanitize_callback,
				'auth_callback'     => static function (): bool {
					return current_user_can( 'edit_products' );
				},
			)
		);
	}
}

function nicked_sanitize_lines( $value ): string {
	if ( is_array( $value ) ) {
		$lines = array_map( 'sanitize_text_field', $value );
	} else {
		$lines = preg_split( '/\r\n|\r|\n/', (string) $value );
		$lines = array_map( 'sanitize_text_field', $lines ?: array() );
	}
	return implode( "\n", array_filter( $lines ) );
}

function nicked_add_product_editor_box(): void {
	add_meta_box(
		'nicked-product-editor',
		__( 'NICKED storefront details and owner review', 'nicked-commerce-bridge' ),
		'nicked_render_product_editor_box',
		'product',
		'normal',
		'high'
	);
}

function nicked_render_product_editor_box( WP_Post $post ): void {
	wp_nonce_field( 'nicked_save_product_fields', 'nicked_product_fields_nonce' );
	$fields = array(
		'nicked_size'           => array( 'Size', 'text' ),
		'nicked_range'          => array( 'Range', 'text' ),
		'nicked_concern'        => array( 'Hair concern', 'text' ),
		'nicked_tagline'        => array( 'Short tagline', 'text' ),
		'nicked_key_points'     => array( 'Key points (one per line)', 'textarea' ),
		'nicked_ideal_for'      => array( 'Ideal for', 'textarea' ),
		'nicked_public_summary' => array( 'Public product overview', 'textarea' ),
		'nicked_how_to_use'     => array( 'How to use', 'textarea' ),
		'nicked_ingredients'    => array( 'Ingredients as printed', 'textarea' ),
	);
	echo '<p>Only fields approved for public display are returned to the storefront. Admin-only review notes and claims are never included in the public endpoint.</p>';
	foreach ( $fields as $key => $definition ) {
		$value = get_post_meta( $post->ID, $key, true );
		echo '<p><label for="' . esc_attr( $key ) . '"><strong>' . esc_html( $definition[0] ) . '</strong></label><br>';
		if ( 'textarea' === $definition[1] ) {
			echo '<textarea class="widefat" rows="3" id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '">' . esc_textarea( is_array( $value ) ? implode( "\n", $value ) : (string) $value ) . '</textarea>';
		} else {
			echo '<input class="widefat" type="text" id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" value="' . esc_attr( (string) $value ) . '">';
		}
		echo '</p>';
	}

	$confirmed_fields = array(
		'nicked_summary_confirmed'     => 'Overview checked for public display',
		'nicked_usage_confirmed'       => 'How-to-use text checked',
		'nicked_ingredients_confirmed' => 'Ingredient list checked',
	);
	echo '<fieldset style="padding:12px;border:1px solid #c3c4c7;margin:16px 0"><legend><strong>Public display checks</strong></legend>';
	foreach ( $confirmed_fields as $key => $label ) {
		$checked = 'yes' === get_post_meta( $post->ID, $key, true );
		echo '<label style="display:block;margin:8px 0"><input type="checkbox" name="' . esc_attr( $key ) . '" value="yes" ' . checked( $checked, true, false ) . '> ' . esc_html( $label ) . '</label>';
	}
	echo '</fieldset>';

	$claims = array(
		'sulfate_free'            => 'Sulfate-free',
		'silicone_free'           => 'Silicone-free',
		'paraben_free'            => 'Paraben-free',
		'heat_235'                => 'Heat protection up to 235°C',
		'uv_protection'           => 'UV protection',
		'scientifically_formulated' => 'Scientifically formulated',
	);
	echo '<fieldset style="padding:12px;border:1px solid #c3c4c7;margin:16px 0"><legend><strong>Admin-only claim review</strong></legend>';
	echo '<p>These fields are private. A claim is not added to the public storefront by changing its status; public copy still needs review and approval.</p>';
	foreach ( $claims as $key => $label ) {
		$value = get_post_meta( $post->ID, 'nicked_claim_' . $key, true ) ?: 'owner_to_confirm';
		echo '<label style="display:block;margin:8px 0"><strong>' . esc_html( $label ) . '</strong> ';
		echo '<select name="nicked_claim_' . esc_attr( $key ) . '">';
		foreach ( array( 'owner_to_confirm' => 'Owner to confirm', 'yes' => 'Confirmed true', 'no' => 'Confirmed false' ) as $option => $option_label ) {
			echo '<option value="' . esc_attr( $option ) . '" ' . selected( $value, $option, false ) . '>' . esc_html( $option_label ) . '</option>';
		}
		echo '</select></label>';
	}
	echo '</fieldset>';
	echo '<p><label for="nicked_owner_review_note"><strong>Private owner review note</strong></label><br><textarea class="widefat" rows="3" id="nicked_owner_review_note" name="nicked_owner_review_note">' . esc_textarea( (string) get_post_meta( $post->ID, 'nicked_owner_review_note', true ) ) . '</textarea></p>';
	echo '<p class="description">Stock, weight, dimensions, price, tax class and product images remain editable in the native WooCommerce product editor.</p>';
}

function nicked_save_product_editor_fields( int $post_id, WP_Post $post ): void {
	if ( ! isset( $_POST['nicked_product_fields_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nicked_product_fields_nonce'] ) ), 'nicked_save_product_fields' ) ) {
		return;
	}
	if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || wp_is_post_revision( $post_id ) || ! current_user_can( 'edit_product', $post_id ) ) {
		return;
	}
	$text_fields = array( 'nicked_size', 'nicked_range', 'nicked_concern', 'nicked_tagline', 'nicked_ideal_for', 'nicked_how_to_use', 'nicked_ingredients', 'nicked_public_summary' );
	foreach ( $text_fields as $key ) {
		if ( isset( $_POST[ $key ] ) ) {
			$value = 'nicked_size' === $key || 'nicked_range' === $key || 'nicked_concern' === $key || 'nicked_tagline' === $key
				? sanitize_text_field( wp_unslash( $_POST[ $key ] ) )
				: sanitize_textarea_field( wp_unslash( $_POST[ $key ] ) );
			update_post_meta( $post_id, $key, $value );
		}
	}
	if ( isset( $_POST['nicked_key_points'] ) ) {
		update_post_meta( $post_id, 'nicked_key_points', nicked_sanitize_lines( wp_unslash( $_POST['nicked_key_points'] ) ) );
	}
	foreach ( array( 'nicked_summary_confirmed', 'nicked_usage_confirmed', 'nicked_ingredients_confirmed' ) as $key ) {
		update_post_meta( $post_id, $key, isset( $_POST[ $key ] ) && 'yes' === sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) ? 'yes' : 'no' );
	}
	foreach ( array( 'sulfate_free', 'silicone_free', 'paraben_free', 'heat_235', 'uv_protection', 'scientifically_formulated' ) as $key ) {
		$field = 'nicked_claim_' . $key;
		if ( isset( $_POST[ $field ] ) ) {
			$value = sanitize_key( wp_unslash( $_POST[ $field ] ) );
			if ( in_array( $value, array( 'yes', 'no', 'owner_to_confirm' ), true ) ) {
				update_post_meta( $post_id, $field, $value );
			}
		}
	}
	if ( isset( $_POST['nicked_owner_review_note'] ) ) {
		update_post_meta( $post_id, 'nicked_owner_review_note', sanitize_textarea_field( wp_unslash( $_POST['nicked_owner_review_note'] ) ) );
	}
}

function nicked_add_admin_menu(): void {
	add_menu_page(
		__( 'NICKED Overview', 'nicked-commerce-bridge' ),
		__( 'NICKED Overview', 'nicked-commerce-bridge' ),
		'manage_woocommerce',
		'nicked-overview',
		'nicked_render_admin_page',
		'dashicons-store',
		56
	);
}

function nicked_add_dashboard_widget(): void {
	if ( current_user_can( 'manage_woocommerce' ) ) {
		wp_add_dashboard_widget( 'nicked_overview_widget', __( 'NICKED Store Overview', 'nicked-commerce-bridge' ), 'nicked_render_dashboard_widget' );
	}
}

function nicked_get_overview_data(): array {
	$since  = gmdate( 'Y-m-d H:i:s', time() - 30 * DAY_IN_SECONDS );
	$orders = wc_get_orders(
		array(
			'limit'        => 500,
			'date_created' => '>=' . $since,
			'return'       => 'objects',
			'orderby'      => 'date',
			'order'        => 'DESC',
		)
	);
	$sales = 0.0;
	$refunds_total = 0.0;
	foreach ( $orders as $order ) {
		if ( $order->is_paid() ) {
			$sales += (float) $order->get_total();
		}
		$refunds_total += (float) $order->get_total_refunded();
	}

	$status_counts = array();
	foreach ( wc_get_order_statuses() as $status => $label ) {
		$key = str_replace( 'wc-', '', $status );
		$status_counts[ $key ] = wc_orders_count( $key );
	}

	$products = wc_get_products( array( 'limit' => 500, 'status' => array( 'publish', 'draft', 'private' ), 'return' => 'objects', 'orderby' => 'title', 'order' => 'ASC' ) );
	$low_stock = array();
	$out_stock = array();
	foreach ( $products as $product ) {
		if ( ! $product->is_in_stock() ) {
			$out_stock[] = $product;
			continue;
		}
		if ( $product->managing_stock() && null !== $product->get_stock_quantity() && $product->get_stock_quantity() <= $product->get_low_stock_amount() ) {
			$low_stock[] = $product;
		}
	}
	$best_sellers = wc_get_products(
		array(
			'limit'    => 5,
			'status'   => 'publish',
			'orderby'  => 'meta_value_num',
			'meta_key' => 'total_sales',
			'order'    => 'DESC',
		)
	);
	$subscriptions = null;
	if ( function_exists( 'wcs_get_subscriptions' ) ) {
		$subscriptions = count( wcs_get_subscriptions( array( 'subscriptions_per_page' => -1, 'subscription_status' => 'active' ) ) );
	}
	return array(
		'orders'         => $orders,
		'sales_30d'      => $sales,
		'refunds_30d'    => $refunds_total,
		'status_counts'  => $status_counts,
		'low_stock'      => $low_stock,
		'out_stock'      => $out_stock,
		'best_sellers'   => $best_sellers,
		'subscriptions'  => $subscriptions,
	);
}

function nicked_render_dashboard_widget(): void {
	$data = nicked_get_overview_data();
	$currency = get_woocommerce_currency();
	echo '<p><strong>Sales in the last 30 days:</strong> ' . wp_kses_post( wc_price( $data['sales_30d'], array( 'currency' => $currency ) ) ) . '</p>';
	echo '<p><strong>Refunds in the last 30 days:</strong> ' . wp_kses_post( wc_price( $data['refunds_30d'], array( 'currency' => $currency ) ) ) . '</p>';
	echo '<p><strong>Low stock:</strong> ' . esc_html( (string) count( $data['low_stock'] ) ) . ' products &nbsp; <strong>Out of stock:</strong> ' . esc_html( (string) count( $data['out_stock'] ) ) . ' products</p>';
	echo '<p><strong>Orders by status:</strong> ';
	$statuses = array();
	foreach ( $data['status_counts'] as $status => $count ) {
		$statuses[] = esc_html( wc_get_order_status_name( $status ) . ': ' . $count );
	}
	echo implode( ' · ', $statuses ) . '</p>';
	if ( null === $data['subscriptions'] ) {
		echo '<p><strong>Active subscriptions:</strong> Subscription extension not detected.</p>';
	} else {
		echo '<p><strong>Active subscriptions:</strong> ' . esc_html( (string) $data['subscriptions'] ) . '</p>';
	}
	echo '<h3>Recent orders</h3><ul>';
	foreach ( array_slice( $data['orders'], 0, 6 ) as $order ) {
		echo '<li><a href="' . esc_url( $order->get_edit_order_url() ) . '">#' . esc_html( $order->get_order_number() ) . '</a> — ' . esc_html( $order->get_formatted_billing_full_name() ?: __( 'Customer', 'nicked-commerce-bridge' ) ) . ' · ' . esc_html( wc_get_order_status_name( $order->get_status() ) ) . ' · ' . wp_kses_post( $order->get_formatted_order_total() ) . '</li>';
	}
	if ( empty( $data['orders'] ) ) {
		echo '<li>No recent orders.</li>';
	}
	echo '</ul><h3>Best sellers</h3><ul>';
	foreach ( $data['best_sellers'] as $product ) {
		echo '<li>' . esc_html( $product->get_name() ) . ' · ' . esc_html( (string) $product->get_total_sales() ) . ' sold</li>';
	}
	if ( empty( $data['best_sellers'] ) ) {
		echo '<li>No sales data yet.</li>';
	}
	echo '</ul><p><a class="button button-primary" href="' . esc_url( admin_url( 'admin.php?page=nicked-overview' ) ) . '">Open NICKED Overview</a></p>';
}

function nicked_register_settings(): void {
	register_setting(
		'nicked_settings_group',
		'nicked_store_settings',
		array( 'sanitize_callback' => 'nicked_sanitize_settings' )
	);
}

function nicked_sanitize_settings( $input ): array {
	$input = is_array( $input ) ? $input : array();
	$text_fields = array(
		'announcement', 'hero_headline', 'hero_intro', 'hero_chips', 'support_phone', 'whatsapp_number', 'support_email',
		'instagram_url', 'facebook_url', 'legal_name', 'business_address',
		'gstin', 'hsn_codes', 'manufacturer_packer', 'country_of_origin',
		'grievance_contact', 'shipping_regions', 'shipping_rates',
		'free_shipping_rule', 'product_weights_dimensions', 'cod',
		'subscription_products', 'subscription_interval_discount',
		'razorpay_subscriptions_status', 'allowed_frontend_origin'
	);
	$clean = array();
	foreach ( $text_fields as $key ) {
		$value = isset( $input[ $key ] ) ? (string) $input[ $key ] : '';
		if ( 'hero_chips' === $key ) {
			$clean[ $key ] = sanitize_textarea_field( $value );
		} else {
			$clean[ $key ] = in_array( $key, array( 'instagram_url', 'facebook_url' ), true ) ? esc_url_raw( $value ) : sanitize_text_field( $value );
		}
	}
	$clean['support_email'] = sanitize_email( $clean['support_email'] );
	foreach ( array( 'shipping', 'returns', 'cancellation', 'privacy', 'terms', 'faq' ) as $policy ) {
		$clean[ 'policy_' . $policy ] = isset( $input[ 'policy_' . $policy ] ) ? sanitize_textarea_field( $input[ 'policy_' . $policy ] ) : '';
		$clean[ 'policy_' . $policy . '_published' ] = ! empty( $input[ 'policy_' . $policy . '_published' ] ) ? 'yes' : 'no';
	}
	return $clean;
}

function nicked_render_admin_page(): void {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		return;
	}
	$data = nicked_get_overview_data();
	$settings = get_option( 'nicked_store_settings', array() );
	$seeded_at = get_option( 'nicked_catalogue_seeded_at' );
	echo '<div class="wrap"><h1>NICKED Overview</h1>';
	echo '<p>Manage products, orders, stock, policies and owner-confirmation fields from WordPress. Payment, shipping and email connections must be configured and tested separately.</p>';
	echo '<div style="padding:14px;border-left:4px solid #b18b51;background:#fffaf2;margin:16px 0"><strong>Staging safeguards:</strong> seeded products are drafts with zero stock. Unconfirmed product claims remain admin-only. No gateway secrets belong in this screen.</div>';
	echo '<p><a class="button" href="' . esc_url( admin_url( 'edit.php?post_type=product' ) ) . '">Manage products</a> <a class="button" href="' . esc_url( admin_url( 'admin.php?page=wc-orders' ) ) . '">Manage orders</a> <a class="button" href="' . esc_url( admin_url( 'admin.php?page=wc-settings&tab=shipping' ) ) . '">Shipping settings</a></p>';

	echo '<h2>Store overview</h2>';
	echo '<p><strong>Last 30 days:</strong> ' . wp_kses_post( wc_price( $data['sales_30d'] ) ) . ' in paid orders · ' . wp_kses_post( wc_price( $data['refunds_30d'] ) ) . ' refunded.</p>';
	echo '<p><strong>Inventory:</strong> ' . esc_html( (string) count( $data['low_stock'] ) ) . ' low-stock · ' . esc_html( (string) count( $data['out_stock'] ) ) . ' out of stock.</p>';
	echo '<p><strong>Products:</strong> ' . esc_html( (string) count( wc_get_products( array( 'limit' => -1, 'status' => array( 'publish', 'draft', 'private' ), 'return' => 'ids' ) ) ) ) . ' catalogue entries.</p>';
	if ( ! $seeded_at ) {
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="margin:16px 0;padding:16px;background:#fff;border:1px solid #c3c4c7;max-width:680px">';
		echo '<input type="hidden" name="action" value="nicked_seed_catalogue">';
		wp_nonce_field( 'nicked_seed_catalogue' );
		echo '<h2>Seed the nine catalogue products</h2><p>This creates only the nine supplied products as unpublished drafts, sets stock to zero, imports the supplied catalogue crops, and leaves all WooCommerce payment and shipping methods untouched.</p><button class="button button-primary">Create draft catalogue</button></form>';
	} else {
		echo '<p><strong>Catalogue seed:</strong> created ' . esc_html( (string) $seeded_at ) . '. Products remain editable in WooCommerce. Re-run the seeder only if you intend to add any missing SKU.</p>';
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="nicked_seed_catalogue">';
		wp_nonce_field( 'nicked_seed_catalogue' );
		echo '<button class="button">Add any missing catalogue SKUs</button></form>';
	}
	echo '<h2>Order status counts</h2><p>';
	$counts = array();
	foreach ( $data['status_counts'] as $status => $count ) {
		$counts[] = esc_html( wc_get_order_status_name( $status ) . ': ' . $count );
	}
	echo implode( ' · ', $counts ) . '</p>';

	echo '<hr><h2>Owner settings</h2>';
	echo '<p>Empty fields remain marked for owner confirmation. Only approved contact details, homepage copy, and the announcement are sent to the storefront.</p>';
	echo '<form method="post" action="options.php">';
	settings_fields( 'nicked_settings_group' );

	nicked_render_setting_section( 'Public store settings', array(
		'announcement' => 'Announcement bar text',
		'hero_headline' => 'Homepage hero headline',
		'hero_intro' => 'Homepage hero introduction',
		'hero_chips' => 'Homepage product chips (one per line: Label|product-slug)',
		'support_phone' => 'Support phone (tel:)',
		'whatsapp_number' => 'WhatsApp number with country code, digits only',
		'support_email' => 'Support email',
		'instagram_url' => 'Instagram URL',
		'facebook_url' => 'Facebook URL',
		'allowed_frontend_origin' => 'Storefront origin for cross-site API requests (leave blank for same-origin)',
	), $settings );
	nicked_render_setting_section( 'Business and listing details', array(
		'legal_name' => 'Legal business name',
		'business_address' => 'Business address',
		'gstin' => 'GSTIN',
		'hsn_codes' => 'HSN codes',
		'manufacturer_packer' => 'Manufacturer / packer details',
		'country_of_origin' => 'Country of origin',
		'grievance_contact' => 'Grievance officer contact',
	), $settings );
	nicked_render_setting_section( 'Operations', array(
		'shipping_regions' => 'Delivery regions',
		'shipping_rates' => 'Shipping rates',
		'free_shipping_rule' => 'Free-shipping rule',
		'product_weights_dimensions' => 'Product weights and dimensions',
		'cod' => 'Cash on Delivery status',
		'subscription_products' => 'Products eligible for subscriptions',
		'subscription_interval_discount' => 'Subscription interval / discount',
		'razorpay_subscriptions_status' => 'Razorpay Subscriptions account status',
	), $settings );
	echo '<h3>Editable policy drafts</h3><p>Add approved customer-facing text. Blank content is returned as an owner-confirmation marker.</p>';
	foreach ( array( 'shipping' => 'Shipping', 'returns' => 'Returns & refunds', 'cancellation' => 'Cancellation', 'privacy' => 'Privacy', 'terms' => 'Terms', 'faq' => 'FAQ' ) as $key => $label ) {
		$field = 'policy_' . $key;
		echo '<p><label for="' . esc_attr( $field ) . '"><strong>' . esc_html( $label ) . '</strong></label><br><textarea class="large-text" rows="3" id="' . esc_attr( $field ) . '" name="nicked_store_settings[' . esc_attr( $field ) . ']">' . esc_textarea( isset( $settings[ $field ] ) ? (string) $settings[ $field ] : '' ) . '</textarea></p>';
		$published_field = $field . '_published';
		$published = isset( $settings[ $published_field ] ) && 'yes' === $settings[ $published_field ];
		echo '<p><label><input type="checkbox" name="nicked_store_settings[' . esc_attr( $published_field ) . ']" value="yes" ' . checked( $published, true, false ) . '> Approve and publish this policy</label></p>';
	}
	submit_button( __( 'Save NICKED settings', 'nicked-commerce-bridge' ) );
	echo '</form>';
	echo '</div>';
}

function nicked_render_setting_section( string $title, array $fields, array $settings ): void {
	echo '<h3>' . esc_html( $title ) . '</h3>';
	foreach ( $fields as $key => $label ) {
		$field_name = 'nicked_store_settings[' . $key . ']';
		$value = isset( $settings[ $key ] ) ? (string) $settings[ $key ] : '';
		echo '<p><label for="' . esc_attr( $key ) . '"><strong>' . esc_html( $label ) . '</strong></label><br>';
		if ( 'hero_chips' === $key ) {
			echo '<textarea class="large-text" rows="4" id="' . esc_attr( $key ) . '" name="' . esc_attr( $field_name ) . '">' . esc_textarea( $value ) . '</textarea><span class="description">Each line is a label and exact WooCommerce product slug separated by a vertical bar.</span></p>';
		} else {
			echo '<input class="regular-text" type="text" id="' . esc_attr( $key ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '"></p>';
		}
	}
}

function nicked_register_rest_routes(): void {
	register_rest_route(
		'nicked/v1',
		'/catalogue',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'nicked_get_public_catalogue',
			'permission_callback' => '__return_true',
		)
	);
	register_rest_route(
		'nicked/v1',
		'/settings',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'nicked_get_public_settings',
			'permission_callback' => '__return_true',
		)
	);
	register_rest_route(
		'nicked/v1',
		'/policies',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'nicked_get_public_policies',
			'permission_callback' => '__return_true',
		)
	);
	register_rest_route(
		'nicked/v1',
		'/orders/track',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'nicked_track_order',
			'permission_callback' => '__return_true',
			'args'                => array(
				'order_number' => array( 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
				'verification' => array( 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
			),
		)
	);
}

function nicked_filter_public_claims( string $text, int $product_id ): string {
	$claim_patterns = array(
		'sulfate_free'              => '/[^.!?]*(?:sulfate|sulphate)[\s-]*free[^.!?]*(?:[.!?]|$)/iu',
		'silicone_free'             => '/[^.!?]*silicone[\s-]*free[^.!?]*(?:[.!?]|$)/iu',
		'paraben_free'              => '/[^.!?]*paraben[\s-]*free[^.!?]*(?:[.!?]|$)/iu',
		'heat_235'                  => '/[^.!?]*(?:up to|upto)\s*235\s*°?\s*c[^.!?]*(?:[.!?]|$)/iu',
		'uv_protection'             => '/[^.!?]*uv protection[^.!?]*(?:[.!?]|$)/iu',
		'scientifically_formulated' => '/[^.!?]*scientifically formulated[^.!?]*(?:[.!?]|$)/iu',
	);
	foreach ( $claim_patterns as $key => $pattern ) {
		if ( 'yes' !== get_post_meta( $product_id, 'nicked_claim_' . $key, true ) ) {
			$text = preg_replace( $pattern, '', $text ) ?? $text;
		}
	}
	return trim( wp_strip_all_tags( $text ) );
}

function nicked_get_public_catalogue(): WP_REST_Response {
	$products = wc_get_products(
		array(
			'status'   => 'publish',
			'limit'    => 100,
			'orderby'  => 'menu_order',
			'order'    => 'ASC',
			'return'   => 'objects',
		)
	);
	$items = array();
	foreach ( $products as $product ) {
		$id = $product->get_id();
		$points = get_post_meta( $id, 'nicked_key_points', true );
		$points = is_array( $points ) ? $points : preg_split( '/\r\n|\r|\n/', (string) $points );
		$points = array_values( array_filter( array_map( 'sanitize_text_field', $points ?: array() ) ) );
		$points = array_values( array_filter( $points, static function ( string $point ) use ( $id ): bool {
			return $point === nicked_filter_public_claims( $point, $id );
		} ) );

		$summary = '';
		if ( 'yes' === get_post_meta( $id, 'nicked_summary_confirmed', true ) ) {
			$summary = nicked_filter_public_claims( (string) get_post_meta( $id, 'nicked_public_summary', true ), $id );
		}
		$usage = '';
		if ( 'yes' === get_post_meta( $id, 'nicked_usage_confirmed', true ) ) {
			$usage = (string) get_post_meta( $id, 'nicked_how_to_use', true );
		}
		$ingredients = '';
		if ( 'yes' === get_post_meta( $id, 'nicked_ingredients_confirmed', true ) ) {
			$ingredients = (string) get_post_meta( $id, 'nicked_ingredients', true );
		}
		$items[] = array(
			'slug'        => $product->get_slug(),
			'size'        => (string) get_post_meta( $id, 'nicked_size', true ),
			'range'       => (string) get_post_meta( $id, 'nicked_range', true ),
			'concern'     => (string) get_post_meta( $id, 'nicked_concern', true ),
			'tagline'     => nicked_filter_public_claims( (string) get_post_meta( $id, 'nicked_tagline', true ), $id ),
			'key_points'  => $points,
			'ideal_for'   => (string) get_post_meta( $id, 'nicked_ideal_for', true ),
			'summary'     => $summary,
			'how_to_use'  => $usage,
			'ingredients' => $ingredients,
		);
	}
	return rest_ensure_response( $items );
}

function nicked_get_public_settings(): WP_REST_Response {
	$settings = get_option( 'nicked_store_settings', array() );
	$keys = array( 'announcement', 'hero_headline', 'hero_intro', 'hero_chips', 'support_phone', 'whatsapp_number', 'support_email', 'instagram_url', 'facebook_url' );
	$public = array();
	foreach ( $keys as $key ) {
		$public[ $key ] = isset( $settings[ $key ] ) ? (string) $settings[ $key ] : '';
	}
	$public['coupons_enabled'] = function_exists( 'wc_coupons_enabled' ) && wc_coupons_enabled();
	return rest_ensure_response( $public );
}

function nicked_get_public_policies(): WP_REST_Response {
	$settings = get_option( 'nicked_store_settings', array() );
	$policies = array();
	foreach ( array( 'shipping' => 'Shipping', 'returns' => 'Returns & refunds', 'cancellation' => 'Cancellation', 'privacy' => 'Privacy', 'terms' => 'Terms', 'faq' => 'Frequently asked questions' ) as $key => $title ) {
		$content = isset( $settings[ 'policy_' . $key ] ) ? trim( (string) $settings[ 'policy_' . $key ] ) : '';
		$is_published = '' !== $content && isset( $settings[ 'policy_' . $key . '_published' ] ) && 'yes' === $settings[ 'policy_' . $key . '_published' ];
		$policies[ $key ] = array(
			'title'   => $title,
			'content' => $is_published ? $content : '[OWNER TO CONFIRM]',
			'status'  => $is_published ? 'published' : ( $content ? 'draft' : 'owner-to-confirm' ),
		);
	}
	return rest_ensure_response( $policies );
}

/**
 * Do not let a direct Store API request place an order while required policies are still drafts.
 * The storefront also disables its submit button until the same policies are published.
 */
function nicked_register_checkout_consent_extension(): void {
	$checkout_schema = '';
	foreach ( array( '\\Automattic\\WooCommerce\\StoreApi\\Schemas\\V1\\CheckoutSchema', '\\Automattic\\WooCommerce\\Blocks\\StoreApi\\Schemas\\CheckoutSchema' ) as $candidate ) {
		if ( class_exists( $candidate ) ) {
			$checkout_schema = $candidate;
			break;
		}
	}
	if ( ! function_exists( 'woocommerce_store_api_register_endpoint_data' ) || '' === $checkout_schema ) {
		return;
	}
	woocommerce_store_api_register_endpoint_data(
		array(
			'endpoint'        => constant( $checkout_schema . '::IDENTIFIER' ),
			'namespace'       => 'nicked',
			'data_callback'   => static function (): array {
				return array( 'policy_consent' => false );
			},
			'schema_callback' => static function (): array {
				return array(
					'properties' => array(
						'policy_consent' => array(
							'description' => __( 'Customer acceptance of the published store terms and privacy policy.', 'nicked-commerce-bridge' ),
							'type'        => 'boolean',
							'context'     => array( 'view', 'edit' ),
							'optional'    => true,
						),
					),
				);
			},
			'schema_type'     => ARRAY_A,
		)
	);
}

function nicked_validate_checkout_consent( $order, WP_REST_Request $request ): void {
	if ( 'POST' !== strtoupper( $request->get_method() ) ) {
		return;
	}
	$settings = get_option( 'nicked_store_settings', array() );
	foreach ( array( 'terms', 'privacy' ) as $policy ) {
		$content = isset( $settings[ 'policy_' . $policy ] ) ? trim( (string) $settings[ 'policy_' . $policy ] ) : '';
		$published = isset( $settings[ 'policy_' . $policy . '_published' ] ) && 'yes' === $settings[ 'policy_' . $policy . '_published' ];
		if ( '' === $content || ! $published ) {
			throw new Exception( __( 'Checkout is unavailable until the store terms and privacy policy are published.', 'nicked-commerce-bridge' ) );
		}
	}
	$extensions = $request->get_param( 'extensions' );
	$consent = is_array( $extensions ) && isset( $extensions['nicked']['policy_consent'] ) ? $extensions['nicked']['policy_consent'] : false;
	if ( true !== $consent ) {
		throw new Exception( __( 'Please accept the store terms and privacy policy before placing an order.', 'nicked-commerce-bridge' ) );
	}
	if ( is_object( $order ) && method_exists( $order, 'update_meta_data' ) ) {
		$order->update_meta_data( '_nicked_policy_consent', 'yes' );
		$order->update_meta_data( '_nicked_policy_consent_at', current_time( 'mysql', true ) );
	}
}

function nicked_track_order( WP_REST_Request $request ) {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
	$key = 'nicked_track_' . hash( 'sha256', wp_salt( 'auth' ) . '|' . $ip );
	$attempts = (int) get_transient( $key );
	if ( $attempts >= 8 ) {
		return new WP_Error( 'nicked_track_rate_limit', __( 'Please wait before trying again.', 'nicked-commerce-bridge' ), array( 'status' => 429 ) );
	}
	set_transient( $key, $attempts + 1, 15 * MINUTE_IN_SECONDS );

	$order_number = trim( (string) $request->get_param( 'order_number' ) );
	$verification = trim( (string) $request->get_param( 'verification' ) );
	if ( ! ctype_digit( $order_number ) || '' === $verification ) {
		return new WP_Error( 'nicked_track_not_found', __( 'We could not verify that order. Check the order number and billing contact.', 'nicked-commerce-bridge' ), array( 'status' => 404 ) );
	}
	$order = wc_get_order( absint( $order_number ) );
	if ( ! $order || (string) $order->get_order_number() !== $order_number ) {
		return new WP_Error( 'nicked_track_not_found', __( 'We could not verify that order. Check the order number and billing contact.', 'nicked-commerce-bridge' ), array( 'status' => 404 ) );
	}

	$email_match = is_email( $verification ) && strtolower( $verification ) === strtolower( (string) $order->get_billing_email() );
	$digits_input = preg_replace( '/\D+/', '', $verification );
	$digits_phone = preg_replace( '/\D+/', '', (string) $order->get_billing_phone() );
	$phone_match = '' !== $digits_input && '' !== $digits_phone && substr( $digits_input, -10 ) === substr( $digits_phone, -10 );
	if ( ! $email_match && ! $phone_match ) {
		return new WP_Error( 'nicked_track_not_found', __( 'We could not verify that order. Check the order number and billing contact.', 'nicked-commerce-bridge' ), array( 'status' => 404 ) );
	}

	$status = $order->get_status();
	$timeline = array();
	$created = $order->get_date_created();
	if ( $created ) {
		$timeline[] = array( 'label' => 'Order placed', 'date' => wc_format_datetime( $created ), 'complete' => true );
	}
	if ( in_array( $status, array( 'processing', 'completed' ), true ) ) {
		$timeline[] = array( 'label' => 'Processing', 'date' => '', 'complete' => true );
	}
	if ( 'completed' === $status ) {
		$completed = $order->get_date_completed();
		$timeline[] = array( 'label' => 'Completed', 'date' => $completed ? wc_format_datetime( $completed ) : '', 'complete' => true );
	}
	$tracking_url = esc_url_raw( (string) $order->get_meta( '_nicked_tracking_url', true ) );
	$courier = sanitize_text_field( (string) $order->get_meta( '_nicked_courier', true ) );
	return rest_ensure_response(
		array(
			'status'       => wc_get_order_status_name( $status ),
			'timeline'     => $timeline,
			'tracking_url' => $tracking_url,
			'courier'      => $courier,
		)
	);
}

function nicked_add_tracking_metabox(): void {
	$screen = get_current_screen();
	if ( $screen ) {
		add_meta_box( 'nicked-order-tracking', __( 'NICKED tracking details', 'nicked-commerce-bridge' ), 'nicked_render_tracking_metabox', $screen->id, 'side', 'default' );
	}
}

function nicked_render_tracking_metabox(): void {
	$order_id = get_the_ID();
	if ( ! $order_id && isset( $_GET['id'] ) ) {
		$order_id = absint( $_GET['id'] );
	}
	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		echo '<p>Save the order before adding tracking details.</p>';
		return;
	}
	wp_nonce_field( 'nicked_save_tracking', 'nicked_tracking_nonce' );
	foreach ( array( '_nicked_courier' => 'Courier name', '_nicked_tracking_number' => 'Tracking number', '_nicked_tracking_url' => 'Customer-visible tracking URL' ) as $key => $label ) {
		echo '<p><label for="' . esc_attr( $key ) . '">' . esc_html( $label ) . '</label><br><input class="widefat" type="text" id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" value="' . esc_attr( (string) $order->get_meta( $key, true ) ) . '"></p>';
	}
	echo '<p class="description">Only verified customers can see these details on the tracking page.</p>';
}

function nicked_save_tracking_fields( int $order_id ): void {
	if ( ! isset( $_POST['nicked_tracking_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nicked_tracking_nonce'] ) ), 'nicked_save_tracking' ) || ! current_user_can( 'edit_shop_order', $order_id ) ) {
		return;
	}
	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		return;
	}
	$fields = array(
		'_nicked_courier'          => 'sanitize_text_field',
		'_nicked_tracking_number'  => 'sanitize_text_field',
		'_nicked_tracking_url'     => 'esc_url_raw',
	);
	foreach ( $fields as $key => $sanitizer ) {
		if ( isset( $_POST[ $key ] ) ) {
			$order->update_meta_data( $key, call_user_func( $sanitizer, wp_unslash( $_POST[ $key ] ) ) );
		}
	}
	$order->save();
}

function nicked_has_past_order( int $product_id ): bool {
	global $wpdb;
	$order_items = $wpdb->prefix . 'woocommerce_order_items';
	$item_meta = $wpdb->prefix . 'woocommerce_order_itemmeta';
	$sql = $wpdb->prepare(
		"SELECT oi.order_item_id FROM {$order_items} oi INNER JOIN {$item_meta} oim ON oi.order_item_id = oim.order_item_id WHERE oi.order_item_type = 'line_item' AND oim.meta_key IN ('_product_id','_variation_id') AND oim.meta_value = %d LIMIT 1",
		$product_id
	);
	return (bool) $wpdb->get_var( $sql );
}

function nicked_archive_ordered_product_before_trash( $trash, WP_Post $post, string $previous_status ) {
	if ( 'product' !== $post->post_type || ! nicked_has_past_order( (int) $post->ID ) ) {
		return $trash;
	}
	update_post_meta( $post->ID, '_nicked_archived', 'yes' );
	update_post_meta( $post->ID, '_nicked_archived_at', current_time( 'mysql' ) );
	wp_update_post( array( 'ID' => $post->ID, 'post_status' => 'private' ) );
	return false;
}

function nicked_archive_ordered_product_before_delete( $check, WP_Post $post, bool $force_delete ) {
	if ( 'product' !== $post->post_type || ! nicked_has_past_order( (int) $post->ID ) ) {
		return $check;
	}
	update_post_meta( $post->ID, '_nicked_archived', 'yes' );
	update_post_meta( $post->ID, '_nicked_archived_at', current_time( 'mysql' ) );
	wp_update_post( array( 'ID' => $post->ID, 'post_status' => 'private' ) );
	return false;
}

function nicked_add_archive_row_action( array $actions, WP_Post $post ): array {
	if ( 'product' !== $post->post_type || ! current_user_can( 'edit_product', $post->ID ) ) {
		return $actions;
	}
	$label = 'yes' === get_post_meta( $post->ID, '_nicked_archived', true ) ? __( 'Restore to draft', 'nicked-commerce-bridge' ) : __( 'Archive and keep history', 'nicked-commerce-bridge' );
	$url = wp_nonce_url( admin_url( 'admin-post.php?action=nicked_archive_product&product_id=' . $post->ID ), 'nicked_archive_product_' . $post->ID );
	$actions['nicked_archive'] = '<a href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a>';
	return $actions;
}

function nicked_add_archive_bulk_action( array $actions ): array {
	$actions['nicked_archive'] = __( 'Archive products and keep history', 'nicked-commerce-bridge' );
	return $actions;
}

function nicked_handle_archive_bulk_action( string $redirect, string $action, array $post_ids ): string {
	if ( 'nicked_archive' !== $action ) {
		return $redirect;
	}
	foreach ( $post_ids as $post_id ) {
		if ( current_user_can( 'edit_product', $post_id ) ) {
			nicked_archive_product( (int) $post_id );
		}
	}
	return add_query_arg( 'nicked_archived', count( $post_ids ), $redirect );
}

add_action( 'admin_post_nicked_archive_product', 'nicked_handle_archive_product' );
function nicked_handle_archive_product(): void {
	$product_id = isset( $_GET['product_id'] ) ? absint( $_GET['product_id'] ) : 0;
	check_admin_referer( 'nicked_archive_product_' . $product_id );
	if ( ! current_user_can( 'edit_product', $product_id ) ) {
		wp_die( esc_html__( 'You do not have permission to archive this product.', 'nicked-commerce-bridge' ) );
	}
	nicked_archive_product( $product_id );
	wp_safe_redirect( admin_url( 'edit.php?post_type=product&nicked_archived=1' ) );
	exit;
}

function nicked_archive_product( int $product_id ): void {
	$archived = 'yes' === get_post_meta( $product_id, '_nicked_archived', true );
	if ( $archived ) {
		delete_post_meta( $product_id, '_nicked_archived' );
		delete_post_meta( $product_id, '_nicked_archived_at' );
		wp_update_post( array( 'ID' => $product_id, 'post_status' => 'draft' ) );
		return;
	}
	update_post_meta( $product_id, '_nicked_archived', 'yes' );
	update_post_meta( $product_id, '_nicked_archived_at', current_time( 'mysql' ) );
	wp_update_post( array( 'ID' => $product_id, 'post_status' => 'private' ) );
}

function nicked_handle_seed_catalogue(): void {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		wp_die( esc_html__( 'You do not have permission to seed the NICKED catalogue.', 'nicked-commerce-bridge' ) );
	}
	check_admin_referer( 'nicked_seed_catalogue' );
	$file = plugin_dir_path( NICKED_BRIDGE_FILE ) . 'data/catalog-seed.json';
	$contents = is_readable( $file ) ? file_get_contents( $file ) : false;
	$catalogue = $contents ? json_decode( $contents, true ) : null;
	if ( ! is_array( $catalogue ) || empty( $catalogue['products'] ) ) {
		wp_die( esc_html__( 'The catalogue seed file could not be read.', 'nicked-commerce-bridge' ) );
	}
	$category_ids = array();
	foreach ( $catalogue['categories'] as $category_name ) {
		$term = term_exists( $category_name, 'product_cat' );
		if ( ! $term ) {
			$term = wp_insert_term( $category_name, 'product_cat' );
		}
		if ( ! is_wp_error( $term ) ) {
			$category_ids[ $category_name ] = (int) ( is_array( $term ) ? $term['term_id'] : $term );
		}
	}
	$created = 0;
	$existing = 0;
	foreach ( $catalogue['products'] as $row ) {
		if ( wc_get_product_id_by_sku( $row['sku'] ) ) {
			$existing++;
			continue;
		}
		$product = new WC_Product_Simple();
		$product->set_name( sanitize_text_field( $row['name'] ) );
		$product->set_slug( sanitize_title( $row['slug'] ) );
		$product->set_sku( sanitize_text_field( $row['sku'] ) );
		$product->set_status( 'draft' );
		$product->set_regular_price( wc_format_decimal( $row['price'] ) );
		$product->set_price( wc_format_decimal( $row['price'] ) );
		$product->set_tax_status( 'taxable' );
		$product->set_manage_stock( true );
		$product->set_stock_quantity( 0 );
		$product->set_stock_status( 'outofstock' );
		$product->set_catalog_visibility( 'visible' );
		$product->set_short_description( sanitize_textarea_field( $row['summary'] ) );
		$product->set_description( '' );
		$product->set_category_ids( array_values( array_filter( array_map( static function ( string $name ) use ( $category_ids ): int {
			return $category_ids[ $name ] ?? 0;
		}, $row['categories'] ) ) ) );
		$product_id = $product->save();
		if ( ! $product_id ) {
			continue;
		}
		wp_set_object_terms( $product_id, sanitize_text_field( $row['range'] ), 'product_tag', false );
		$meta = array(
			'nicked_size' => $row['size'],
			'nicked_range' => $row['range'],
			'nicked_concern' => $row['concern'],
			'nicked_tagline' => $row['tagline'],
			'nicked_key_points' => implode( "\n", $row['key_points'] ),
			'nicked_ideal_for' => $row['ideal_for'],
			'nicked_public_summary' => $row['summary'],
			'nicked_how_to_use' => $row['how_to_use'],
			'nicked_ingredients' => $row['ingredients'],
			'nicked_summary_confirmed' => '' !== $row['summary'] ? 'yes' : 'no',
			'nicked_usage_confirmed' => ! empty( $row['usage_confirmed'] ) ? 'yes' : 'no',
			'nicked_ingredients_confirmed' => ! empty( $row['ingredients_confirmed'] ) ? 'yes' : 'no',
			'nicked_owner_review_note' => $row['review_note'],
			'_nicked_archived' => 'no',
		);
		foreach ( $meta as $key => $value ) {
			update_post_meta( $product_id, $key, $value );
		}
		foreach ( array( 'sulfate_free', 'silicone_free', 'paraben_free', 'heat_235', 'uv_protection', 'scientifically_formulated' ) as $claim ) {
			update_post_meta( $product_id, 'nicked_claim_' . $claim, 'owner_to_confirm' );
		}
		$attachment_id = nicked_import_catalogue_image( $row['image_file'] );
		if ( $attachment_id ) {
			$product = wc_get_product( $product_id );
			$product->set_image_id( $attachment_id );
			$product->save();
		}
		$created++;
	}
	update_option( 'nicked_catalogue_seeded_at', current_time( 'mysql' ) );
	$redirect = add_query_arg( array( 'page' => 'nicked-overview', 'nicked_seeded' => $created, 'nicked_existing' => $existing ), admin_url( 'admin.php' ) );
	wp_safe_redirect( $redirect );
	exit;
}

function nicked_import_catalogue_image( string $filename ): int {
	$source = plugin_dir_path( NICKED_BRIDGE_FILE ) . 'assets/catalog/' . basename( $filename );
	if ( ! is_readable( $source ) ) {
		return 0;
	}
	$bits = wp_upload_bits( basename( $filename ), null, file_get_contents( $source ) );
	if ( ! empty( $bits['error'] ) ) {
		return 0;
	}
	require_once ABSPATH . 'wp-admin/includes/image.php';
	$attachment_id = wp_insert_attachment(
		array(
			'post_mime_type' => 'image/webp',
			'post_title'     => sanitize_text_field( pathinfo( $filename, PATHINFO_FILENAME ) ),
			'post_status'    => 'inherit',
		),
		$bits['file']
	);
	if ( is_wp_error( $attachment_id ) || ! $attachment_id ) {
		return 0;
	}
	$metadata = wp_generate_attachment_metadata( $attachment_id, $bits['file'] );
	wp_update_attachment_metadata( $attachment_id, $metadata );
	return (int) $attachment_id;
}

function nicked_add_rest_headers(): void {
	remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
	add_filter( 'rest_pre_serve_request', 'nicked_add_allowed_cors_headers', 10, 4 );
	add_filter( 'rest_allowed_cors_headers', 'nicked_extend_allowed_cors_headers', 10, 2 );
	add_filter( 'rest_exposed_cors_headers', 'nicked_extend_exposed_cors_headers', 10, 2 );
}

function nicked_extend_allowed_cors_headers( array $headers, WP_REST_Request $request ): array {
	foreach ( array( 'Cart-Token', 'Cart-Hash', 'Nonce', 'X-WC-Store-API-Nonce' ) as $header ) {
		if ( ! in_array( strtolower( $header ), array_map( 'strtolower', $headers ), true ) ) {
			$headers[] = $header;
		}
	}
	return $headers;
}

function nicked_extend_exposed_cors_headers( array $headers, WP_REST_Request $request ): array {
	foreach ( array( 'Cart-Token', 'Cart-Hash', 'Nonce', 'X-WC-Store-API-Nonce' ) as $header ) {
		if ( ! in_array( strtolower( $header ), array_map( 'strtolower', $headers ), true ) ) {
			$headers[] = $header;
		}
	}
	return $headers;
}

function nicked_add_allowed_cors_headers( bool $served, $result, WP_REST_Request $request, WP_REST_Server $server ): bool {
	$settings = get_option( 'nicked_store_settings', array() );
	$allowed = isset( $settings['allowed_frontend_origin'] ) ? trim( (string) $settings['allowed_frontend_origin'] ) : '';
	$origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? esc_url_raw( wp_unslash( $_SERVER['HTTP_ORIGIN'] ) ) : '';
	if ( '' !== $allowed && '' !== $origin && hash_equals( untrailingslashit( $allowed ), untrailingslashit( $origin ) ) ) {
		header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ) );
		header( 'Access-Control-Allow-Credentials: true' );
		header( 'Access-Control-Allow-Methods: OPTIONS, GET, POST, PUT, PATCH, DELETE' );
		header( 'Vary: Origin', false );
	}
	return $served;
}
